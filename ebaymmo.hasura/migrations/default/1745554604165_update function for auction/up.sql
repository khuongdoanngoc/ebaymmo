CREATE OR REPLACE FUNCTION public.reset_and_create_new_auction() RETURNS void
    LANGUAGE plpgsql
AS $$
DECLARE
    pos RECORD;
    new_bid_id uuid;
    v_lock_obtained BOOLEAN;
BEGIN
    -- Cố gắng lấy khóa advisory để tránh thực thi đồng thời
    SELECT pg_try_advisory_lock(hashtext('reset_auction_lock')) INTO v_lock_obtained;
    
    IF NOT v_lock_obtained THEN
        RAISE NOTICE 'Không thể lấy khóa, hàm đang được thực thi bởi tiến trình khác';
        RETURN;
    END IF;

    -- Xử lý một position trong một giao dịch
    BEGIN
        -- Khóa bảng positions để tránh race condition
        LOCK TABLE public.positions IN SHARE ROW EXCLUSIVE MODE;
        
        -- Chọn một position để xử lý
        SELECT 
            p.position_id,
            p.winner_stores,
            p.position_name,
            p.start_date,
            p.end_date,
            p.category_id,
            p.bid_amount
        INTO pos
        FROM public.positions p
        WHERE (p.start_date IS NULL 
            OR p.end_date IS NULL
            OR p.end_date <= NOW() + INTERVAL '2 days')
        AND p.status != 'completed'
        ORDER BY p.end_date ASC
        LIMIT 1;
        
        -- Nếu tìm thấy position
        IF FOUND THEN
            -- Đánh dấu position đang xử lý
            UPDATE public.positions
            SET 
                status = 'processing',
                update_at = NOW()
            WHERE position_id = pos.position_id;
            
            -- Cập nhật trạng thái các bid cũ
            UPDATE public.bids
            SET 
                bid_status = 'active',
                update_at = NOW()
            WHERE position_id = pos.position_id;
    
            -- Đánh dấu position đã hoàn thành
            UPDATE public.positions
            SET 
                status = 'completed',
                update_at = NOW()
            WHERE position_id = pos.position_id;
    
            -- Tạo bid mới và lưu bid_id
            WITH new_bid AS (
                INSERT INTO public.bids (
                    bid_id,
                    position_id,
                    store_id,
                    bid_amount,
                    bid_status,
                    bid_date,
                    create_at,
                    update_at
                ) VALUES (
                    gen_random_uuid(),
                    pos.position_id,
                    NULL,
                    COALESCE(pos.bid_amount, 1000),
                    'active',
                    GREATEST(NOW(), pos.end_date),
                    NOW(),
                    NOW()
                ) RETURNING bid_id
            )
            SELECT bid_id INTO new_bid_id FROM new_bid;
            
            -- Cập nhật position với start_date và end_date dựa trên bid_date của bid mới
            UPDATE public.positions
            SET 
                start_date = (SELECT bid_date FROM public.bids WHERE bid_id = new_bid_id),
                end_date = (SELECT bid_date FROM public.bids WHERE bid_id = new_bid_id),
                status = 'completed',
                update_at = NOW()
            WHERE position_id = pos.position_id;
            
            -- Ghi log để kiểm tra
            RAISE NOTICE 'Tạo bid mới cho position % (ID: %). bid_id: %, end_date mới: %', 
                pos.position_name, 
                pos.position_id, 
                new_bid_id, 
                (SELECT bid_date  FROM public.bids WHERE bid_id = new_bid_id);
            
            -- Kiểm tra xem end_date có được cập nhật đúng không
            PERFORM (
                SELECT 1 
                FROM public.positions p
                JOIN public.bids b ON b.position_id = p.position_id
                WHERE p.position_id = pos.position_id 
                AND p.end_date = b.bid_date + INTERVAL '2 days'
                AND b.bid_id = new_bid_id
            );
            IF NOT FOUND THEN
                RAISE WARNING 'Không thể cập nhật end_date cho position % (ID: %)', 
                    pos.position_name, pos.position_id;
            ELSE
                RAISE NOTICE 'Cập nhật thành công position % (ID: %)', 
                    pos.position_name, pos.position_id;
            END IF;
            
        ELSE
            RAISE NOTICE 'Không tìm thấy position nào cần xử lý';
        END IF;
        
        -- Xóa các job timetable cho position đã hoàn thành
        DELETE FROM timetable.task 
        WHERE chain_id IN (
            SELECT chain_id 
            FROM timetable.chain 
            WHERE chain_name LIKE 'reset_auction_job_%'
            AND chain_name IN (
                SELECT 'reset_auction_job_' || position_id::text
                FROM public.positions
                WHERE status = 'completed'
            )
        );
        
        DELETE FROM timetable.chain 
        WHERE chain_name LIKE 'reset_auction_job_%'
        AND chain_name IN (
            SELECT 'reset_auction_job_' || position_id::text
            FROM public.positions
            WHERE status = 'completed'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Nếu có lỗi, đặt lại trạng thái position
            IF pos.position_id IS NOT NULL THEN
                UPDATE public.positions
                SET status = 'pending'
                WHERE position_id = pos.position_id
                AND status = 'processing';
            END IF;
            RAISE NOTICE 'Lỗi xảy ra: %', SQLERRM;
            RAISE;
    END;
    
    -- Giải phóng khóa
    PERFORM pg_advisory_unlock(hashtext('reset_auction_lock'));
END;
$$;

CREATE OR REPLACE FUNCTION public.schedule_auction_reset() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id UUID;
    v_end_date TIMESTAMP;
    v_job_name TEXT;
    v_chain_id INTEGER;
    v_record_found BOOLEAN := FALSE;
BEGIN
    -- Xử lý một bản ghi sắp hết hạn (trong vòng 2 ngày) mà chưa được đánh dấu là completed
    SELECT position_id, end_date INTO v_id, v_end_date
    FROM public.positions
    WHERE end_date <= NOW() + INTERVAL '2 days'
    AND status != 'completed'  -- Chỉ xử lý những position chưa completed
    AND winner_stores IS NULL
    ORDER BY end_date ASC
    LIMIT 1;
    
    IF v_id IS NOT NULL THEN
        -- Gọi hàm reset để xử lý đấu giá sắp hết hạn
        PERFORM public.reset_and_create_new_auction();
        RAISE NOTICE 'Đã xử lý đấu giá sắp hết hạn % với end_date %', v_id, v_end_date;
        v_record_found := TRUE;
    END IF;
    
    -- Lên lịch cho các đấu giá trong tương lai mà chưa được lên lịch
    FOR v_id, v_end_date IN
        SELECT position_id, end_date 
        FROM public.positions
        WHERE end_date > NOW() + INTERVAL '2 days'
        AND status != 'completed'  -- Chỉ lên lịch cho những position chưa completed
    LOOP
        v_job_name := 'reset_auction_job_' || v_id;
        
        -- Kiểm tra xem job này đã tồn tại chưa
        PERFORM 1 
        FROM timetable.chain 
        WHERE chain_name = v_job_name;
        
        IF NOT FOUND THEN  -- Chỉ tạo mới nếu job chưa tồn tại
            -- Chèn chain mới với thời gian chạy là end_date
            INSERT INTO timetable.chain (chain_name, run_at)
            VALUES (v_job_name, v_end_date)
            RETURNING chain_id INTO v_chain_id;
            
            -- Chèn task mới - khi được chạy, task này sẽ gọi hàm reset_and_create_new_auction
            INSERT INTO timetable.task (chain_id, task_name, kind, command)
            VALUES (v_chain_id, v_job_name || '_task', 'SQL', 'SELECT public.reset_and_create_new_auction();');
            
            RAISE NOTICE 'Đã lên lịch công việc % để chạy vào %', v_job_name, v_end_date;
            v_record_found := TRUE;
        END IF;
    END LOOP;
    
    IF NOT v_record_found THEN
        RAISE NOTICE 'Không tìm thấy bản ghi nào cần xử lý';
    END IF;
END;
$$;