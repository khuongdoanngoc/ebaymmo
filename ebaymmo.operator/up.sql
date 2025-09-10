SET check_function_bodies = false;
CREATE TYPE public.auction_result AS (
	position_id uuid,
	status text,
	message text
);
CREATE TYPE public.bid_result AS (
	success boolean,
	message text,
	bid_id uuid,
	bid_amount numeric(10,2)
);
CREATE TYPE public.bid_results AS (
	success boolean,
	message text,
	bid_id uuid,
	bid_amount numeric(10,2)
);
CREATE TYPE public.bid_status AS ENUM (
    'pending',
    'won',
    'lost',
    'active',
    'completed',
    'cancelled'
);
CREATE TYPE public.bid_status_new AS ENUM (
    'pending',
    'active',
    'completed',
    'cancelled'
);
CREATE TYPE public.category_status AS ENUM (
    'active',
    'inactive'
);
CREATE TYPE public.deposit_status AS ENUM (
    'pending',
    'completed',
    'failed'
);
CREATE TYPE public.network_code AS ENUM (
    'bsc',
    'eth',
    'ton'
);
CREATE TYPE public.notification_status AS ENUM (
    'seen',
    'sent',
    'received'
);
CREATE TYPE public.order_response AS (
	order_id uuid,
	total_amount numeric,
	message text
);
CREATE TYPE public.position_reset_result AS (
	position_id uuid,
	position_name text,
	old_winner_id uuid,
	reset_time timestamp without time zone,
	status text
);
CREATE TYPE public.process_payment_result AS (
	order_id uuid,
	message text
);
CREATE TYPE public.product_item_status AS ENUM (
    'sale',
    'notsale',
    'outofstock',
    'discontinued'
);
CREATE TYPE public.reseller_order_status AS ENUM (
    'pending',
    'completed',
    'cancelled'
);
CREATE TYPE public.reseller_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);
CREATE TYPE public.role_rule AS ENUM (
    'USER',
    'ADMIN'
);
CREATE TYPE public.sale_status AS ENUM (
    'sale',
    'notsale'
);
CREATE TYPE public.store_status AS ENUM (
    'pending',
    'active',
    'inactive'
);
CREATE TYPE public.support_ticket_status AS ENUM (
    'open',
    'closed',
    'pending'
);
CREATE TYPE public.transaction_action_status_enum AS ENUM (
    'refund',
    'pending',
    'complete',
    'cancel'
);
CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'completed',
    'failed'
);
CREATE TYPE public.transaction_type AS ENUM (
    'payment',
    'refund'
);
CREATE TYPE public.user_status AS ENUM (
    'active',
    'suspended',
    'banned'
);
CREATE TYPE public.withdrawal_result_type AS (
	success boolean,
	message text,
	withdrawal_id uuid,
	user_id uuid,
	amount numeric,
	new_balance numeric,
	withdrawal_status text,
	reference_code text
);
CREATE TYPE public.withdrawal_status AS ENUM (
    'pending',
    'completed',
    'canceled'
);
CREATE FUNCTION public.add_transaction(buyer_id uuid, product_id uuid, quantity integer, coupon_id uuid DEFAULT NULL::uuid, discount numeric DEFAULT 0, store_id uuid DEFAULT NULL::uuid, input_total_amount numeric DEFAULT NULL::numeric) RETURNS TABLE(order_id uuid, total_amount numeric, message text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    product_price numeric(10,2);
    available_stock numeric;
    new_order_id uuid;
    final_amount numeric(10,2);
    product_store_id uuid;
    coupon_discount numeric;
    coupon_store_id uuid;
    user_status public.user_status;
    store_status public.store_status;
BEGIN
    -- Kiểm tra trạng thái user
    SELECT status INTO user_status
    FROM public.users
    WHERE user_id = buyer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User không tồn tại';
    END IF;
    IF user_status != 'active' THEN
        RAISE EXCEPTION 'User không trong trạng thái active';
    END IF;
    -- Kiểm tra sản phẩm và lấy thông tin
    SELECT 
        price, 
        stock_count,
        store_id,
        status
    INTO 
        product_price, 
        available_stock,
        product_store_id,
        store_status
    FROM public.products p
    JOIN public.stores s ON p.store_id = s.store_id
    WHERE product_id = add_transaction.product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sản phẩm không tồn tại';
    END IF;
    -- Kiểm tra store status
    IF store_status != 'active' THEN
        RAISE EXCEPTION 'Store không trong trạng thái active';
    END IF;
    -- Kiểm tra store_id nếu được cung cấp
    IF store_id IS NOT NULL AND store_id != product_store_id THEN
        RAISE EXCEPTION 'Store ID không khớp với sản phẩm';
    END IF;
    -- Kiểm tra số lượng hợp lệ
    IF quantity <= 0 THEN
        RAISE EXCEPTION 'Số lượng phải lớn hơn 0';
    END IF;
    -- Kiểm tra tồn kho
    IF available_stock < quantity THEN
        RAISE EXCEPTION 'Số lượng tồn kho không đủ (Còn: %)', available_stock;
    END IF;
    -- Kiểm tra và áp dụng coupon nếu có
    IF coupon_id IS NOT NULL THEN
        SELECT 
            discount_value,
            store_id,
            CASE 
                WHEN NOW() < start_date THEN 'not_started'
                WHEN NOW() > end_date THEN 'expired'
                ELSE 'valid'
            END as coupon_status
        INTO 
            coupon_discount,
            coupon_store_id
        FROM public.coupons
        WHERE coupon_id = add_transaction.coupon_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Coupon không tồn tại';
        END IF;
        IF coupon_status = 'not_started' THEN
            RAISE EXCEPTION 'Coupon chưa có hiệu lực';
        END IF;
        IF coupon_status = 'expired' THEN
            RAISE EXCEPTION 'Coupon đã hết hạn';
        END IF;
        IF coupon_store_id != product_store_id THEN
            RAISE EXCEPTION 'Coupon không áp dụng cho store này';
        END IF;
        -- Sử dụng giá trị discount từ coupon nếu có
        discount := COALESCE(coupon_discount, discount);
    END IF;
    -- Tính tổng tiền
    IF input_total_amount IS NULL THEN
        final_amount := product_price * quantity;
    ELSE
        final_amount := input_total_amount;
    END IF;
    -- Áp dụng giảm giá
    IF discount > 0 THEN
        IF discount >= 100 THEN
            RAISE EXCEPTION 'Discount không thể >= 100%%';
        END IF;
        final_amount := final_amount * (1 - discount / 100);
    END IF;
    -- Bắt đầu transaction
    BEGIN
        -- Chèn đơn hàng
        INSERT INTO public.orders (
            order_id, 
            buyer_id, 
            order_date, 
            total_amount, 
            product_id, 
            quantity, 
            create_at, 
            update_at, 
            coupon_id, 
            store_id,
            order_status
        )
        VALUES (
            gen_random_uuid(), 
            buyer_id, 
            CURRENT_TIMESTAMP, 
            final_amount, 
            product_id, 
            quantity, 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP, 
            coupon_id, 
            COALESCE(store_id, product_store_id),
            'pending'
        )
        RETURNING order_id INTO new_order_id;
        -- Cập nhật tồn kho
        UPDATE public.products
        SET 
            stock_count = stock_count - quantity,
            sold_count = COALESCE(sold_count, 0) + quantity,
            update_at = CURRENT_TIMESTAMP
        WHERE product_id = add_transaction.product_id;
        -- Cập nhật store metrics
        UPDATE public.stores
        SET 
            total_stock_count = total_stock_count - quantity,
            total_sold_count = total_sold_count + quantity,
            update_at = CURRENT_TIMESTAMP
        WHERE store_id = product_store_id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Lỗi khi tạo transaction: %', SQLERRM;
    END;
    -- Trả về thông tin đơn hàng vừa tạo
    RETURN QUERY
    SELECT 
        new_order_id AS order_id,
        final_amount AS total_amount,
        'Transaction created successfully' AS message;
END;
$$;
CREATE FUNCTION public.check_address_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Đếm số lượng địa chỉ hiện tại của user
  IF (
    SELECT COUNT(*)
    FROM addresses
    WHERE user_id = NEW.user_id
  ) >= 3 THEN
    RAISE EXCEPTION 'User cannot have more than 3 wallet addresses';
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.check_duplicate_identifiers(p_product_id uuid, p_identifiers text[]) RETURNS TABLE(identifier text, is_duplicate boolean)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  WITH input_identifiers AS (
    SELECT unnest(p_identifiers) AS identifier
  )
  SELECT
    i.identifier::text,
    EXISTS (
      SELECT 1
      FROM product_items pi
      WHERE 
        pi.product_id = p_product_id
        AND LOWER(SPLIT_PART(pi.data_text, '|', 1)) = LOWER(i.identifier)
    ) AS is_duplicate
  FROM input_identifiers i;
END;
$$;
CREATE PROCEDURE public.check_duplicate_with_sold_items()
    LANGUAGE plpgsql
    AS $$
DECLARE
    duplicates_found INTEGER := 0;
    items_checked INTEGER := 0;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time INTERVAL;
    error_message TEXT;
BEGIN
    -- Ghi lại thời gian bắt đầu
    start_time := clock_timestamp();
    BEGIN
        -- Bước 1: Đầu tiên, reset tất cả is_duplicate thành false và xóa checked_at
        UPDATE product_items
        SET 
            is_duplicate = false,
            checked_at = NULL
        WHERE 
            status = 'notsale';
        -- Bước 2: Sử dụng bảng tạm để xác định các sản phẩm trùng lặp
        CREATE TEMP TABLE temp_duplicates AS
        SELECT 
            product_item_id,
            LOWER(TRIM(SPLIT_PART(data_text, '|', 1))) AS identifier,
            ROW_NUMBER() OVER (
                PARTITION BY LOWER(TRIM(SPLIT_PART(data_text, '|', 1))) 
                ORDER BY create_at
            ) AS row_num
        FROM product_items
        WHERE status = 'notsale';
        -- Bước 3: Đánh dấu các bản sao là trùng lặp (row_num > 1)
        UPDATE product_items
        SET 
            is_duplicate = true,
            checked_at = NOW()
        FROM temp_duplicates
        WHERE 
            product_items.product_item_id = temp_duplicates.product_item_id
            AND temp_duplicates.row_num > 1;
        GET DIAGNOSTICS duplicates_found = ROW_COUNT;
        -- Bước 4: Đếm tổng số mục đã kiểm tra
        SELECT COUNT(*) INTO items_checked
        FROM product_items
        WHERE status = 'notsale';
        -- Bước 5: Xóa bảng tạm
        DROP TABLE temp_duplicates;
        -- Tính thời gian thực thi
        end_time := clock_timestamp();
        execution_time := end_time - start_time;
        -- Lưu kết quả thành công
        INSERT INTO public.duplicate_check_results(
            run_at, 
            items_checked, 
            duplicates_found, 
            execution_time, 
            status
        )
        VALUES(
            NOW(), 
            items_checked, 
            duplicates_found, 
            execution_time, 
            'SUCCESS'
        );
    EXCEPTION WHEN OTHERS THEN
        -- Cố gắng xóa bảng tạm nếu tồn tại
        BEGIN
            DROP TABLE IF EXISTS temp_duplicates;
        EXCEPTION WHEN OTHERS THEN
            -- Bỏ qua lỗi khi xóa bảng
        END;
        -- Ghi lại lỗi nếu có
        error_message := SQLERRM;
        -- Lưu kết quả lỗi
        INSERT INTO public.duplicate_check_results(
            run_at,
            items_checked,
            duplicates_found,
            execution_time,
            status
        )
        VALUES(
            NOW(),
            0,
            0,
            clock_timestamp() - start_time,
            'ERROR: ' || error_message
        );
        RAISE NOTICE 'Error in check_duplicate_with_sold_items: %', error_message;
    END;
    RAISE NOTICE 'Duplicate check completed: checked % items, found % duplicates', 
          items_checked, duplicates_found;
END; $$;
CREATE FUNCTION public.check_product_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    product_count integer;
BEGIN
    -- Count existing products for the store
    SELECT COUNT(*) INTO product_count
    FROM public.products
    WHERE store_id = NEW.store_id;
    -- Check if adding new product would exceed limit
    IF product_count >= 10 THEN
        RAISE EXCEPTION 'Store cannot have more than 10 products';
    END IF;
    RETURN NEW;
END;
$$;
CREATE FUNCTION public.check_reseller_commission_rate() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if commission rate exceeds 35%
    IF NEW.commission_rate > 35 THEN
        RAISE EXCEPTION 'Commission rate cannot exceed 35%%';
    END IF;
    RETURN NEW;
END;
$$;
CREATE FUNCTION public.check_store_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    store_count integer;
BEGIN
    -- Count existing stores for the user
    SELECT COUNT(*) INTO store_count
    FROM public.stores
    WHERE seller_id = NEW.seller_id;
    -- Check if adding new store would exceed limit
    IF store_count >= 5 THEN
        RAISE EXCEPTION 'User cannot have more than 5 stores';
    END IF;
    RETURN NEW;
END;
$$;
CREATE FUNCTION public.cleanup_zero_bid_history() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Xóa các bản ghi có bid_amount = 0
    WITH deleted AS (
        DELETE FROM public.bids_history
        WHERE bid_amount = 0
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count
    FROM deleted;
    -- Log kết quả
    INSERT INTO public.bids_history (
        history_id,
        bid_id,
        store_id,
        bid_amount,
        bid_status,
        create_at,
        description
    ) VALUES (
        gen_random_uuid(),
        NULL,
        NULL,
        6868,
        'system',
        NOW(),
        format('Đã xóa %s bản ghi bid_history có bid_amount = 0', deleted_count)
    );
END;
$$;
CREATE FUNCTION public.complete_auction(p_bid_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    winning_bid RECORD;
    highest_amount numeric;
BEGIN
    -- Lấy thông tin bid được chỉ định và giá cao nhất từ bids_history
    WITH highest_bid AS (
        SELECT bh.position_id, MAX(bh.bid_amount) as highest_amount
        FROM public.bids_history bh
        WHERE bh.position_id = (
            SELECT position_id FROM public.bids WHERE bid_id = p_bid_id
        )
        AND bh.action = 'hold_bid'
        AND bh.status = 'hold'
        GROUP BY bh.position_id
    )
    SELECT b.*, s.store_id, s.store_name, hb.highest_amount
    INTO winning_bid 
    FROM public.bids b
    JOIN public.stores s ON b.store_id = s.store_id
    JOIN highest_bid hb ON b.position_id = b.position_id
    WHERE b.bid_id = p_bid_id
    AND b.bid_status = 'pending'
    FOR UPDATE;
    -- Kiểm tra bid tồn tại
    IF winning_bid IS NULL THEN
        INSERT INTO public.bids_history (
            history_id,
            bid_id,
            store_id,
            position_id,
            bid_amount,
            action,
            status,
            create_at,
            description
        ) VALUES (
            gen_random_uuid(),
            p_bid_id,
            NULL,
            NULL,
            NULL,
            'failed',
            'failed',
            NOW(),
            'Không tìm thấy bid hợp lệ để kết thúc đấu giá'
        );
        RETURN;
    END IF;
    -- Cập nhật trạng thái và số tiền trong bảng bids
    UPDATE public.bids
    SET bid_status = 'completed',
        bid_amount = winning_bid.highest_amount,
        update_at = NOW()
    WHERE bid_id = p_bid_id;
    -- Cập nhật winner_store_id trong positions
    UPDATE public.positions 
    SET winner_store_id = winning_bid.store_id,
        update_at = NOW()
    WHERE position_id = winning_bid.position_id;
    -- Cập nhật bids_history từ hold_bid/hold thành win/win
    UPDATE public.bids_history
    SET action = 'win',
        status = 'win',
        update_at = NOW()
    WHERE bid_id = p_bid_id
    AND action = 'hold_bid'
    AND status = 'hold';
    -- Log kết quả đấu giá
    INSERT INTO public.bids_history (
        history_id,
        bid_id,
        store_id, 
        position_id,
        bid_amount,
        action,
        status,
        create_at,
        description
    ) VALUES (
        gen_random_uuid(),
        p_bid_id,
        winning_bid.store_id,
        winning_bid.position_id,
        winning_bid.highest_amount,
        'auction_end',
        'completed',
        NOW(),
        format('Kết thúc đấu giá - Store %s (%s) thắng với giá cao nhất %s VND', 
               winning_bid.store_id, winning_bid.store_name, winning_bid.highest_amount)
    );
EXCEPTION WHEN OTHERS THEN
    -- Log lỗi
    INSERT INTO public.bids_history (
        history_id,
        bid_id,
        store_id,
        position_id, 
        bid_amount,
        action,
        status,
        create_at,
        description
    ) VALUES (
        gen_random_uuid(),
        p_bid_id,
        NULL,
        NULL,
        NULL,
        'error',
        'error',
        NOW(),
        format('Lỗi khi kết thúc đấu giá: %s', SQLERRM)
    );
    RAISE;
END;
$$;
CREATE FUNCTION public.create_reseller_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Chỉ tạo reseller_order nếu có referral_code
  IF NEW.referral_code IS NOT NULL THEN
    DECLARE
      reseller_id uuid;
      commission_rate numeric;
    BEGIN
      -- Tìm reseller hợp lệ
      SELECT r.reseller_id, r.commission_rate INTO reseller_id, commission_rate
      FROM resellers r
      JOIN users u ON r.user_id = u.user_id
      WHERE u.referral_code = NEW.referral_code
      AND r.status = 'approved'
      AND r.is_active = true;
      -- Chỉ tạo reseller_order nếu tìm thấy reseller hợp lệ
      IF reseller_id IS NOT NULL THEN
        -- Tính commission
        DECLARE
          commission_amount numeric := (NEW.total_amount * commission_rate / 100);
        BEGIN
          INSERT INTO reseller_orders (
            order_id,      -- Link với order gốc
            reseller_id,
            commission_amount,
            status,
            create_at,
            update_at
          ) VALUES (
            NEW.order_id,  -- Sử dụng order_id từ order vừa tạo
            reseller_id,
            commission_amount,
            'completed',
            NOW(),
            NOW()
          );
        END;
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TABLE public.donations (
    donation_id uuid NOT NULL,
    blog_id character varying(36),
    user_id uuid,
    amount numeric(10,2),
    donation_date timestamp with time zone,
    transaction_id character varying,
    create_at timestamp without time zone,
    update_at timestamp without time zone
);
CREATE FUNCTION public.donate_to_blog(p_donor_id uuid, p_blog_id character varying, p_donation_amount numeric) RETURNS SETOF public.donations
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_donation_id uuid;
    v_blog_record record;
    v_author_id uuid;
BEGIN
    -- Check if blog exists and get author ID
    SELECT blog_id, user_id INTO v_blog_record FROM public.blogs 
    WHERE blog_id = p_blog_id AND is_deleted IS NULL;
    IF v_blog_record IS NULL THEN
        RAISE EXCEPTION 'Blog with ID % not found or has been deleted', p_blog_id;
    END IF;
    -- Get author ID from the blog
    v_author_id := v_blog_record.user_id;
    -- Check if donor has enough balance
    DECLARE
        v_donor_balance numeric;
    BEGIN
        SELECT balance INTO v_donor_balance FROM public.users WHERE user_id = p_donor_id;
        IF v_donor_balance IS NULL THEN
            RAISE EXCEPTION 'Donor with ID % not found', p_donor_id;
        END IF;
        IF v_donor_balance < p_donation_amount THEN
            RAISE EXCEPTION 'Insufficient balance. Current balance: %, Donation amount: %', v_donor_balance, p_donation_amount;
        END IF;
    END;
    -- Create donation record
    v_donation_id := gen_random_uuid();
    INSERT INTO public.donations (
        donation_id,
        blog_id,
        user_id,
        amount,
        donation_date,
        create_at,
        update_at
    ) 
    VALUES (
        v_donation_id,
        p_blog_id,
        p_donor_id,
        p_donation_amount,
        NOW(),
        NOW(),
        NOW()
    );
    -- Update blog donation counters
    UPDATE public.blogs
    SET 
        donation_count = COALESCE(donation_count, 0) + 1,
        donate_amount = COALESCE(donate_amount, 0) + p_donation_amount,
        update_at = NOW()
    WHERE blog_id = p_blog_id;
    -- Deduct money from donor's balance
    UPDATE public.users
    SET 
        balance = balance - p_donation_amount,
        update_at = NOW()
    WHERE user_id = p_donor_id;
    -- Add money to author's balance
    UPDATE public.users
    SET 
        balance = COALESCE(balance, 0) + p_donation_amount,
        update_at = NOW()
    WHERE user_id = v_author_id;
    -- Return the donation record
    RETURN QUERY SELECT * FROM public.donations WHERE donation_id = v_donation_id;
END;
$$;
CREATE FUNCTION public.ensure_unique_referral_code() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    code CHAR(6);
    code_exists BOOLEAN;
BEGIN
    LOOP
        code := public.generate_referral_code();
        SELECT EXISTS (
            SELECT 1 FROM public.users WHERE referral_code = code
        ) INTO code_exists;
        IF NOT code_exists THEN
            NEW.referral_code := code;
            EXIT;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;
CREATE FUNCTION public.ensure_unique_store_slug() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Tạo slug cơ bản từ tên store
    base_slug := generate_store_slug(NEW.store_name);
    new_slug := base_slug;
    -- Kiểm tra xem slug đã tồn tại chưa
    WHILE EXISTS (
        SELECT 1 FROM stores 
        WHERE slug = new_slug 
        AND store_id != NEW.store_id
    ) LOOP
        -- Nếu slug đã tồn tại, thêm số ngẫu nhiên vào cuối
        new_slug := base_slug || '-' || floor(random() * 9999 + 1)::TEXT;
        counter := counter + 1;
        -- Tránh vòng lặp vô hạn
        IF counter > 10 THEN
            RAISE EXCEPTION 'Could not generate unique slug after 10 attempts';
        END IF;
    END LOOP;
    -- Gán slug mới cho store
    NEW.slug := new_slug;
    RETURN NEW;
END;
$$;
CREATE TABLE public.bids_history (
    history_id uuid NOT NULL,
    bid_id uuid,
    bid_amount numeric(10,2) NOT NULL,
    bid_date timestamp with time zone DEFAULT now() NOT NULL,
    action character varying NOT NULL,
    status character varying NOT NULL,
    create_at timestamp with time zone DEFAULT now() NOT NULL,
    update_at timestamp with time zone DEFAULT now() NOT NULL,
    store_id uuid,
    position_id uuid,
    description text
);
CREATE FUNCTION public.finalize_bid_aution(p_bid_id uuid) RETURNS SETOF public.bids_history
    LANGUAGE plpgsql
    AS $$
DECLARE
    winning_bid RECORD;
    bid_position_id uuid;
    result public.bids_history;
BEGIN
    -- Lấy position_id từ bid hiện tại
    SELECT position_id INTO bid_position_id
    FROM public.bids 
    WHERE bid_id = p_bid_id;
    IF bid_position_id IS NULL THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(), p_bid_id, NULL, NULL, 0,
            'failed', 'failed', NOW(),
            'Không tìm thấy bid với ID này'
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    -- Lấy thông tin bid cao nhất từ bids_history cho bid_id này
    SELECT 
        bh.*,
        s.store_name
    INTO winning_bid 
    FROM public.bids_history bh
    JOIN public.stores s ON bh.store_id = s.store_id
    WHERE bh.bid_id = p_bid_id
    AND bh.action = 'hold_bid'
    AND bh.status = 'hold'
    ORDER BY bh.bid_amount DESC  -- Thêm ORDER BY
    LIMIT 1;  -- Chỉ lấy 1 bản ghi cao nhất
    -- Kiểm tra bid tồn tại
    IF winning_bid IS NULL THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(), p_bid_id, NULL, bid_position_id, 0,
            'failed', 'failed', NOW(),
            'Không tìm thấy bid hợp lệ trong lịch sử đấu giá'
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    -- Cập nhật trạng thái trong bảng bids
    UPDATE public.bids
    SET bid_status = 'completed',
        bid_amount = winning_bid.bid_amount,
        update_at = NOW()
    WHERE bid_id = p_bid_id;
    -- Cập nhật winner_store_id trong positions
    UPDATE public.positions 
    SET winner_stores = winning_bid.store_id,
        update_at = NOW()
    WHERE position_id = bid_position_id;
    -- Cập nhật bids_history từ hold_bid/hold thành win/win
    UPDATE public.bids_history
    SET action = 'win',
        status = 'win',
        update_at = NOW()
    WHERE bid_id = p_bid_id
    AND action = 'hold_bid'
    AND status = 'hold';
    -- Log kết quả đấu giá
    INSERT INTO public.bids_history (
        history_id,
        bid_id,
        store_id, 
        position_id,
        bid_amount,
        action,
        status,
        create_at,
        description
    ) VALUES (
        gen_random_uuid(),
        p_bid_id,
        winning_bid.store_id,
        bid_position_id,
        winning_bid.bid_amount,
        'auction_end',
        'completed',
        NOW(),
        format('Kết thúc đấu giá - Store %s (%s) thắng với giá %s VND', 
               winning_bid.store_id, winning_bid.store_name, winning_bid.bid_amount)
    ) RETURNING * INTO result;
    RETURN NEXT result;
    RETURN;
EXCEPTION WHEN OTHERS THEN
    -- Log lỗi
    INSERT INTO public.bids_history (
        history_id,
        bid_id,
        store_id,
        position_id, 
        bid_amount,
        action,
        status,
        create_at,
        description
    ) VALUES (
        gen_random_uuid(),
        p_bid_id,
        NULL,
        bid_position_id,
        0,
        'error',
        'error',
        NOW(),
        format('Lỗi khi kết thúc đấu giá: %s', SQLERRM)
    ) RETURNING * INTO result;
    RETURN NEXT result;
    RETURN;
END;
$$;
CREATE FUNCTION public.generate_referral_code() RETURNS character
    LANGUAGE plpgsql
    AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result CHAR(6) := '';
    i INTEGER := 0;
    pos INTEGER := 0;
BEGIN
    FOR i IN 1..6 LOOP
        pos := 1 + FLOOR(RANDOM() * 36)::INTEGER;
        result := result || SUBSTRING(chars, pos, 1);
    END LOOP;
    RETURN result;
END;
$$;
CREATE FUNCTION public.generate_store_slug(store_name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    normalized_slug TEXT;
BEGIN
    -- Chuyển đổi thành chữ thường
    normalized_slug := lower(store_name);
    -- Chuyển đổi các ký tự có dấu thành không dấu
    normalized_slug := translate(normalized_slug,
        'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ',
        'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyy'
    );
    -- Thay thế các ký tự không phải chữ và số bằng dấu gạch ngang
    normalized_slug := regexp_replace(normalized_slug, '[^a-z0-9]+', '-', 'g');
    -- Loại bỏ dấu gạch ngang ở đầu và cuối
    normalized_slug := trim(both '-' from normalized_slug);
    RETURN normalized_slug;
END;
$$;
CREATE FUNCTION public.handle_reseller_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Chỉ xử lý khi có referral_code
  IF NEW.referral_code IS NOT NULL THEN
    DECLARE
      reseller_id uuid;
      commission_rate numeric;
      existing_reseller_order_id uuid;
    BEGIN
      -- Kiểm tra xem đã có reseller_order cho order này chưa
      SELECT order_id INTO existing_reseller_order_id
      FROM reseller_orders
      WHERE order_id = NEW.order_id;
      -- Nếu chưa có reseller_order, tạo mới
      IF existing_reseller_order_id IS NULL THEN
        -- Tìm reseller hợp lệ
        SELECT r.reseller_id, r.commission_rate INTO reseller_id, commission_rate
        FROM resellers r
        JOIN users u ON r.user_id = u.user_id
        WHERE u.referral_code = NEW.referral_code
        AND r.status = 'approved'
        AND r.is_active = true;
        -- Chỉ tạo reseller_order nếu tìm thấy reseller hợp lệ
        IF reseller_id IS NOT NULL THEN
          -- Tính commission
          DECLARE
            commission_amount numeric := (NEW.total_amount * commission_rate / 100);
          BEGIN
            INSERT INTO reseller_orders (
              order_id,
              reseller_id,
              commission_amount,
              status,
              create_at,
              update_at
            ) VALUES (
              NEW.order_id,
              reseller_id,
              commission_amount,
              'completed',  -- Set status là completed ngay từ đầu
              NOW(),
              NOW()
            );
          END;
        END IF;
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.hold_bid_amount(p_store_id uuid, p_position_id uuid, p_bid_amount numeric, p_bid_id uuid) RETURNS SETOF public.bids_history
    LANGUAGE plpgsql
    AS $$
DECLARE
    store_info RECORD;
    result public.bids_history;
    refunded_amount numeric := 0;
    current_highest_bid RECORD;
    previous_bid RECORD;  -- Thêm dòng này
BEGIN
    -- Lấy thông tin store và user với lock
    SELECT s.*, u.user_id, u.balance, u.held_balance
    INTO store_info
    FROM public.stores s
    JOIN public.users u ON s.seller_id = u.user_id
    WHERE s.store_id = p_store_id
    AND s.status = 'active'
    FOR UPDATE OF u;
    -- Kiểm tra store tồn tại và active
    IF store_info IS NULL THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount, 
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(), p_bid_id, p_store_id, p_position_id, p_bid_amount,
            'failed', 'failed', NOW(),
            'Store không tồn tại hoặc không hoạt động'
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    -- Kiểm tra số dư ban đầu
    IF store_info.balance < p_bid_amount THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(), p_bid_id, p_store_id, p_position_id, p_bid_amount,
            'failed', 'failed', NOW(),
            format('Số dư không đủ. Cần: %s VND, Hiện có: %s VND', 
                   p_bid_amount, store_info.balance)
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    -- Lấy bid cao nhất hiện tại
    SELECT bh.*
    INTO current_highest_bid
    FROM public.bids_history bh
    WHERE bh.position_id = p_position_id
    AND bh.action = 'hold_bid'
    AND bh.status = 'hold'
    ORDER BY bh.bid_amount DESC
    LIMIT 1;
    -- Nếu bid mới không cao hơn bid hiện tại
    IF current_highest_bid IS NOT NULL AND p_bid_amount <= current_highest_bid.bid_amount THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(), p_bid_id, p_store_id, p_position_id, p_bid_amount,
            'failed', 'failed', NOW(),
            format('Giá đặt (%s VND) phải cao hơn giá hiện tại (%s VND)',
                   p_bid_amount, current_highest_bid.bid_amount)
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    -- Hoàn tiền ngay lập tức cho tất cả các bid thấp hơn
    FOR previous_bid IN (
        SELECT bh.*, u.user_id, u.held_balance, s.store_id
        FROM public.bids_history bh
        JOIN public.stores s ON bh.store_id = s.store_id
        JOIN public.users u ON s.seller_id = u.user_id
        WHERE bh.position_id = p_position_id
        AND bh.action = 'hold_bid'
        AND bh.status = 'hold'
        AND bh.bid_amount < p_bid_amount
        FOR UPDATE OF u
    ) LOOP
        -- Nếu là bid của chính chủ
        IF previous_bid.store_id = p_store_id THEN
            refunded_amount := refunded_amount + previous_bid.bid_amount;
        -- Nếu là bid của người khác
        ELSE
            -- Hoàn tiền ngay
            UPDATE public.users
            SET balance = balance + previous_bid.bid_amount,
                held_balance = COALESCE(held_balance, 0) - previous_bid.bid_amount,
                update_at = NOW()
            WHERE user_id = previous_bid.user_id;
        END IF;
        -- Log hoàn tiền
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(),
            previous_bid.bid_id,
            previous_bid.store_id,
            p_position_id,
            previous_bid.bid_amount,
            'refund', 'completed', NOW(),
            CASE 
                WHEN previous_bid.store_id = p_store_id THEN
                    format('Đã hoàn %s VND cho bid cũ của chính store này do đặt bid mới cao hơn', 
                           previous_bid.bid_amount)
                ELSE
                    format('Đã hoàn %s VND do có bid mới cao hơn từ store %s', 
                           previous_bid.bid_amount, p_store_id)
            END
        );
        -- Cập nhật trạng thái bid cũ
        UPDATE public.bids_history
        SET status = 'refunded',
            update_at = NOW()
        WHERE history_id = previous_bid.history_id;
    END LOOP;
    -- Trừ tiền và cập nhật held_balance cho bid mới
    UPDATE public.users
    SET balance = balance - (p_bid_amount - refunded_amount),
        held_balance = COALESCE(held_balance, 0) - refunded_amount + p_bid_amount,
        update_at = NOW()
    WHERE user_id = store_info.user_id;
    -- Log giữ tiền cho bid mới
    INSERT INTO public.bids_history (
        history_id, bid_id, store_id, position_id, bid_amount,
        action, status, create_at, description
    ) VALUES (
        gen_random_uuid(),
        p_bid_id,
        p_store_id,
        p_position_id,
        p_bid_amount,
        'hold_bid', 'hold', NOW(),
        format('Đã giữ %s VND (thực trừ: %s VND) cho bid mới trên vị trí %s',
               p_bid_amount, p_bid_amount - refunded_amount, p_position_id)
    ) RETURNING * INTO result;
    RETURN NEXT result;
    RETURN;
EXCEPTION 
    WHEN OTHERS THEN
        -- Log lỗi nếu có
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(),
            p_bid_id,
            p_store_id,
            p_position_id,
            p_bid_amount,
            'error', 'error', NOW(),
            format('Lỗi khi xử lý đấu giá: %s', SQLERRM)
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
END;
$$;
CREATE FUNCTION public.process_auction_reset() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    pos RECORD;
    initial_bid_amount decimal;
    new_bid_id uuid;
BEGIN
    -- Xử lý các position đã đến end_date
    FOR pos IN 
        SELECT 
            p.position_id,
            p.winner_stores,
            p.position_name,
            p.start_date,
            p.end_date
        FROM public.positions p
        WHERE p.end_date <= NOW()
        AND p.status = 'active'
    LOOP
        -- Tính initial_bid_amount
        initial_bid_amount := 
            CASE pos.position_name
                WHEN 'Top 1' THEN 200
                WHEN 'Top 2' THEN 180
                WHEN 'Top 3' THEN 150
                WHEN 'Top 4' THEN 110
                WHEN 'Top 5' THEN 80
                ELSE 70
            END;
        -- Log bắt đầu reset
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, bid_amount, 
            status, create_at, description
        ) VALUES (
            gen_random_uuid(), NULL, pos.winner_stores, 0,
            'system', NOW(),
            format('Bắt đầu reset đấu giá cho vị trí %s', pos.position_name)
        );
        -- Cập nhật position
        UPDATE public.positions
        SET 
            winner_stores = NULL,
            start_date = NOW(),
            end_date = NOW() + interval '7 days',
            update_at = NOW(),
            status = 'active'
        WHERE position_id = pos.position_id;
        -- Cập nhật trạng thái các bid cũ
        UPDATE public.bids
        SET 
            bid_status = 'completed',
            update_at = NOW()
        WHERE position_id = pos.position_id
        AND bid_status = 'active';
        -- Tạo bid mới
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
            initial_bid_amount,
            'active',
            NOW() + interval '7 days',
            NOW(),
            NOW()
        )
        RETURNING bid_id INTO new_bid_id;
        -- Log kết thúc reset
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, bid_amount, 
            status, create_at, description
        ) VALUES (
            gen_random_uuid(), new_bid_id, NULL, initial_bid_amount,
            'system', NOW(),
            format('Đã reset đấu giá cho vị trí %s. Giá khởi điểm: %s', 
                   pos.position_name, initial_bid_amount)
        );
    END LOOP;
END;
$$;
CREATE TABLE public.orders (
    order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    buyer_id uuid,
    order_date timestamp with time zone,
    total_amount numeric(10,2),
    order_status character varying,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    product_id uuid,
    quantity integer,
    price numeric(10,2),
    order_code character varying(255),
    coupon_id uuid,
    referral_code character varying,
    order_type character varying
);
CREATE FUNCTION public.process_delayed_payment() RETURNS SETOF public.orders
    LANGUAGE plpgsql
    AS $$
DECLARE
    order_record RECORD;
    processed_order_ids uuid[] := ARRAY[]::uuid[];
    system_user_id uuid := '4aa9e580-331a-49c5-a352-de34e8d25585'::uuid; -- ID của hệ thống
BEGIN
    -- Lấy các orders đã đủ 2 phút và chưa được xử lý
    FOR order_record IN 
        SELECT o.*, 
               COALESCE(latest_log.logs_by, system_user_id) as last_updated_by,
               latest_log.status_after as last_status
        FROM public.orders o
        LEFT JOIN LATERAL (
            -- Lấy log mới nhất cho mỗi order
            SELECT logs_by, status_after
            FROM public.orders_logs
            WHERE order_id = o.order_id
            ORDER BY change_date DESC
            LIMIT 1
        ) latest_log ON true
        WHERE o.create_at + INTERVAL '3 days' <= CURRENT_TIMESTAMP --2 minutes
          AND order_status IN ('pending', 'completed', 'cancel')
    LOOP
        BEGIN
            CASE order_record.order_status
                WHEN 'pending' THEN
                    -- Chuyển tiền cho seller
                    UPDATE public.users
                    SET balance = balance + order_record.total_amount,
                        update_at = CURRENT_TIMESTAMP
                    WHERE user_id = (
                        SELECT s.seller_id 
                        FROM public.products p
                        JOIN public.stores s ON p.store_id = s.store_id
                        WHERE p.product_id = order_record.product_id
                    );
                    -- Cập nhật trạng thái order thành successed
                    UPDATE public.orders
                    SET order_status = 'successed',
                        update_at = CURRENT_TIMESTAMP
                    WHERE order_id = order_record.order_id;
                    -- Ghi log completed by system
                    INSERT INTO public.orders_logs (
                        logs_by,
                        status_before,
                        status_after,
                        order_id,
                        change_date,
                        create_at,
                        update_at
                    )
                    VALUES (
                        system_user_id,  -- System vì quá 2 phút tự động chuyển
                        'pending',
                        'successed',
                        order_record.order_id,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    );
                WHEN 'completed' THEN
                    -- Chuyển tiền cho seller
                    UPDATE public.users
                    SET balance = balance + order_record.total_amount,
                        update_at = CURRENT_TIMESTAMP
                    WHERE user_id = (
                        SELECT s.seller_id 
                        FROM public.products p
                        JOIN public.stores s ON p.store_id = s.store_id
                        WHERE p.product_id = order_record.product_id
                    );
                    -- Cập nhật trạng thái order thành successed
                    UPDATE public.orders
                    SET order_status = 'successed',
                        update_at = CURRENT_TIMESTAMP
                    WHERE order_id = order_record.order_id;
                    -- Ghi log completed bởi user đã sửa trạng thái
                    INSERT INTO public.orders_logs (
                        logs_by,
                        status_before,
                        status_after,
                        order_id,
                        change_date,
                        create_at,
                        update_at
                    )
                    VALUES (
                        order_record.last_updated_by, -- Người đã sửa trạng thái
                        'completed',
                        'successed',
                        order_record.order_id,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    );
                WHEN 'cancel' THEN
                    -- Hoàn tiền cho khách hàng
                    UPDATE public.users
                    SET balance = balance + order_record.total_amount,
                        update_at = CURRENT_TIMESTAMP
                    WHERE user_id = order_record.buyer_id;
                    -- Hoàn số lượng vào kho
                    UPDATE public.products
                    SET stock_count = stock_count + order_record.quantity,
                        sold_count = sold_count - order_record.quantity,
                        update_at = CURRENT_TIMESTAMP
                    WHERE product_id = order_record.product_id;
                    -- Cập nhật trạng thái product_items liên quan
                    WITH cte AS (
                        SELECT pi.product_item_id
                        FROM public.product_items pi
                        --WHERE pi.order_id = order_record.order_id
                        WHERE pi.product_id = (SELECT product_id FROM public.orders WHERE order_id = order_record.order_id) -- Sử dụng product_id từ đơn hàng
                         AND (pi.sale_at = order_record.create_at) -- So sánh sale_at với create_at hoặc NULL
                        --LIMIT order_record.quantity -- Chỉ cập nhật số lượng tương ứng với đơn hàng
                        LIMIT (SELECT quantity FROM public.orders WHERE order_id = order_record.order_id) -- Chỉ lấy số lượng tương ứng với đơn hàng
                    )
                    UPDATE public.product_items
                    SET 
                        status = 'notsale',
                        sale_at = NULL,
                        update_at = CURRENT_TIMESTAMP
                    WHERE product_item_id IN (SELECT product_item_id FROM cte);
                    -- Cập nhật trạng thái order
                    UPDATE public.orders
                    SET order_status = 'refunded',
                        update_at = CURRENT_TIMESTAMP
                    WHERE order_id = order_record.order_id;
                    -- Ghi log refund
                    INSERT INTO public.orders_logs (
                        logs_by,
                        status_before,
                        status_after,
                        order_id,
                        change_date,
                        create_at,
                        update_at
                    )
                    VALUES (
                        order_record.last_updated_by, -- Giữ người đã cancel
                        'cancel',
                        'refunded',
                        order_record.order_id,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    );
            END CASE;
            -- Thêm order_id vào array các order đã xử lý
            processed_order_ids := array_append(processed_order_ids, order_record.order_id);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error processing order %: %', order_record.order_id, SQLERRM;
        END;
    END LOOP;
    -- Trả về các orders đã được xử lý
    RETURN QUERY
    SELECT o.*
    FROM public.orders o
    WHERE o.order_id = ANY(processed_order_ids);
END;
$$;
CREATE FUNCTION public.process_order_referral() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Chỉ xử lý khi có referral_code
  IF NEW.referral_code IS NOT NULL THEN
    -- Gọi function process_reseller_commission để xử lý
    PERFORM public.process_reseller_commission(NEW.order_id, NEW.referral_code);
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.process_reseller_commission(p_order_id uuid, p_referral_code text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reseller_id uuid;
    v_commission_rate numeric;
    v_total_amount numeric;
    v_existing_order uuid;
BEGIN
    -- Kiểm tra đã tồn tại reseller_order chưa
    SELECT order_id INTO v_existing_order
    FROM reseller_orders
    WHERE order_id = p_order_id;
    IF v_existing_order IS NULL THEN
        -- Lấy thông tin reseller từ referral code
        SELECT r.reseller_id, r.commission_rate
        INTO v_reseller_id, v_commission_rate
        FROM public.resellers r
        JOIN public.users u ON r.user_id = u.user_id
        WHERE u.referral_code = p_referral_code
        AND r.status = 'approved'
        AND r.is_active = true;
        IF FOUND THEN
            -- Kiểm tra commission_rate
            IF v_commission_rate > 35 THEN
                RAISE EXCEPTION 'Commission rate cannot exceed 35%%';
            END IF;
            -- Lấy total_amount từ order
            SELECT total_amount
            INTO v_total_amount
            FROM public.orders
            WHERE order_id = p_order_id;
            -- Tạo reseller order record
            INSERT INTO public.reseller_orders (
                reseller_id,
                order_id,
                commission_amount,
                status,
                create_at,
                update_at
            )
            VALUES (
                v_reseller_id,
                p_order_id,
                (v_total_amount * v_commission_rate / 100),
                'pending',
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Created reseller order for order_id: %', p_order_id;
        END IF;
    END IF;
END;
$$;
CREATE FUNCTION public.process_reseller_orders_view_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert vào bảng gốc reseller_orders
    INSERT INTO reseller_orders (
      id,
      order_id,
      reseller_id,
      commission_amount,
      status,
      create_at,
      update_at
    ) VALUES (
      COALESCE(NEW.id, gen_random_uuid()),
      NEW.order_id,
      NEW.reseller_id,
      NEW.commission_amount,
      NEW.status,
      COALESCE(NEW.create_at, NOW()),
      COALESCE(NEW.update_at, NOW())
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update bảng gốc reseller_orders
    UPDATE reseller_orders SET
      commission_amount = NEW.commission_amount,
      status = NEW.status,
      update_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Delete từ bảng gốc reseller_orders
    DELETE FROM reseller_orders WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TABLE public.withdrawals (
    withdrawal_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    amount numeric(10,2),
    withdrawal_status public.withdrawal_status,
    request_date timestamp with time zone,
    processed_date timestamp with time zone,
    description text,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    balance_address text,
    address_id uuid
);
CREATE FUNCTION public.process_withdrawal(p_user_id uuid, p_amount double precision, p_balance_address text) RETURNS SETOF public.withdrawals
    LANGUAGE plpgsql
    AS $$
DECLARE 
    v_current_balance numeric;
    v_withdrawal_record withdrawals;
BEGIN
    -- Kiểm tra số dư hiện tại
    SELECT balance INTO v_current_balance
    FROM public.users
    WHERE user_id = p_user_id AND status = 'active'
    FOR UPDATE;
    -- Kiểm tra tài khoản tồn tại và có đủ số dư
    IF v_current_balance IS NULL THEN
        RAISE EXCEPTION 'User not found or inactive';
    END IF;
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Current balance: %', v_current_balance;
    END IF;
    -- Cập nhật số dư user
    UPDATE public.users
    SET 
        balance = balance - p_amount,
        update_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
    -- Tạo bản ghi withdrawal
    INSERT INTO public.withdrawals(
        withdrawal_id,
        user_id,
        amount,
        withdrawal_status,
        request_date,
        processed_date,
        description,
        create_at,
        update_at,
        balance_address  -- Thêm trường này
    )
    VALUES (
        gen_random_uuid(),
        p_user_id,
        p_amount,
        'pending'::withdrawal_status,
        CURRENT_TIMESTAMP,
        NULL,
        'Withdrawal request',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        p_balance_address  -- Sử dụng tham số được truyền vào
    )
    RETURNING * INTO v_withdrawal_record;
    -- Trả về bản ghi withdrawal vừa tạo
    RETURN NEXT v_withdrawal_record;
    RETURN;
EXCEPTION WHEN OTHERS THEN
    -- Rollback any changes if error occurs
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;
CREATE FUNCTION public.reset_and_create_new_auction() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    pos RECORD;
    winner_stores uuid;
    initial_bid_amount decimal;
    position_end_date timestamptz;
BEGIN
    -- Lấy các position chưa có ngày hoặc đã hết hạn
    FOR pos IN 
        SELECT 
            p.position_id,
            p.winner_stores,
            p.position_name,
            p.start_date,
            p.end_date
        FROM public.positions p
        WHERE p.start_date IS NULL 
           OR p.end_date IS NULL
           OR p.end_date <= NOW()  -- Thay đổi điều kiện kiểm tra end_date
    LOOP
        -- Lưu winner_stores cũ
        winner_stores := pos.winner_stores;
        -- Set giá khởi điểm theo position
        initial_bid_amount := 
            CASE pos.position_name
                WHEN 'Top 1' THEN 1000000
                WHEN 'Top 2' THEN 800000
                WHEN 'Top 3' THEN 600000
                WHEN 'Top 4' THEN 400000
                WHEN 'Top 5' THEN 200000
                ELSE 100000
            END;
        -- Reset position và tạo phiên đấu giá mới
        UPDATE public.positions
        SET 
            winner_stores = NULL,  -- Reset winner_stores
            start_date = NOW(),
            end_date = NOW() + interval '7 days',
            update_at = NOW(),
            status = 'active'
        WHERE position_id = pos.position_id
        RETURNING end_date INTO position_end_date;
        -- Đánh dấu hoàn thành các bid cũ
        UPDATE public.bids
        SET 
            bid_status = 'completed',
            update_at = NOW()
        WHERE position_id = pos.position_id
        AND bid_status = 'active';
        -- Tạo bid mới với giá khởi điểm
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
            initial_bid_amount,
            'active',
            position_end_date,
            NOW(),
            NOW()
        );
    END LOOP;
END;
$$;
CREATE FUNCTION public.schedule_next_auction_reset() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    next_end_date timestamp;
BEGIN
    -- Lấy end_date gần nhất của position
    SELECT end_date INTO next_end_date
    FROM public.positions
    WHERE status = 'active'
    AND end_date > NOW()
    ORDER BY end_date ASC
    LIMIT 1;
    IF next_end_date IS NOT NULL THEN
        -- Log thông tin schedule
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, bid_amount, 
            status, create_at, description
        ) VALUES (
            gen_random_uuid(), NULL, NULL, 0,
            'system', NOW(),
            format('Lên lịch reset đấu giá cho thời điểm: %s', next_end_date)
        );
    END IF;
END;
$$;
CREATE FUNCTION public.submit_order_product(buyer_id uuid, seller_id uuid, product_id uuid, quantity integer, coupon_value numeric DEFAULT NULL::numeric) RETURNS SETOF public.orders
    LANGUAGE plpgsql
    AS $_$
DECLARE
    total_amount numeric(10,2);
    product_price numeric(10,2);
    available_stock integer;
    buyer_balance numeric(10,2);
    new_order_id uuid;
    store_seller_id uuid;
    final_amount numeric(10,2);
    store_id uuid;
    new_order_code char(6);    
BEGIN
    -- Kiểm tra tính hợp lệ của buyer_id, seller_id, product_id
    IF buyer_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = buyer_id) THEN
        RAISE EXCEPTION 'buyer_id không hợp lệ hoặc không tồn tại';
    END IF;
    IF seller_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.stores WHERE public.stores.seller_id = submit_order_product.seller_id) THEN
        RAISE EXCEPTION 'seller_id không hợp lệ hoặc không tồn tại';
    END IF;
    IF product_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.products WHERE public.products.product_id = submit_order_product.product_id) THEN
        RAISE EXCEPTION 'product_id không hợp lệ hoặc không tồn tại';
    END IF;
    -- Kiểm tra sản phẩm có tồn tại và lấy thông tin
    SELECT 
        p.price, 
        p.stock_count,
        s.seller_id,
        s.store_id
    INTO 
        product_price, 
        available_stock,
        store_seller_id,
        store_id
    FROM public.products p
    JOIN public.stores s ON p.store_id = s.store_id
    WHERE p.product_id = submit_order_product.product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy sản phẩm';
    END IF;
    -- Xác minh người bán
    IF store_seller_id IS DISTINCT FROM submit_order_product.seller_id THEN
        RAISE EXCEPTION 'Người bán không hợp lệ cho sản phẩm này';
    END IF;
    -- Kiểm tra tồn kho
    IF available_stock < submit_order_product.quantity THEN
        RAISE EXCEPTION 'Hàng tồn kho không đủ. Có sẵn: %, Yêu cầu: %', 
            available_stock, submit_order_product.quantity;
    END IF;
    -- Tính tổng số tiền
    total_amount := product_price * submit_order_product.quantity;
    -- Áp dụng mã giảm giá nếu có
    IF coupon_value IS NOT NULL AND coupon_value > 0 THEN
        final_amount := total_amount * (1 - coupon_value / 100);
    ELSE
        final_amount := total_amount;
    END IF;
    -- Kiểm tra số dư người mua
    SELECT balance INTO buyer_balance
    FROM public.users u
    WHERE u.user_id = submit_order_product.buyer_id;
    IF buyer_balance < final_amount THEN
        RAISE EXCEPTION 'Số dư không đủ. Cần: %, Có sẵn: %',
            final_amount, buyer_balance;
    END IF;
    -- Trừ tiền từ tài khoản người mua
    UPDATE public.users
    SET 
        balance = balance - final_amount,
        update_at = CURRENT_TIMESTAMP
    WHERE user_id = submit_order_product.buyer_id;
    -- Tạo mã đơn hàng
    new_order_code := 'ORD' || LPAD((
        SELECT COALESCE(
            (SELECT MAX(CAST(SUBSTRING(order_code FROM 4) AS INTEGER)) + 1
             FROM public.orders
             WHERE order_code ~ '^ORD[0-9]{3}$'),
            1
        )
    )::text, 3, '0');
    -- Kiểm tra xem mã vừa tạo đã tồn tại chưa
    WHILE EXISTS (
        SELECT 1 
        FROM public.orders 
        WHERE order_code = new_order_code
    ) LOOP
    -- Nếu đã tồn tại, tăng số cuối lên 1 và thử lại
    new_order_code := 'ORD' || LPAD(
        (CAST(SUBSTRING(new_order_code FROM 4) AS INTEGER) + 1)::text, 
            3, 
            '0'
        );
    END LOOP;
    -- Thêm đơn hàng vào bảng `orders`
    INSERT INTO public.orders (
        order_id,
        buyer_id,
        order_date,
        total_amount,
        order_status,
        create_at,
        update_at,
        product_id,
        quantity,
        price,
        order_type,
        order_code
    )
    VALUES (
        gen_random_uuid(),
        submit_order_product.buyer_id,
        CURRENT_TIMESTAMP,
        final_amount,
        'pending',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        submit_order_product.product_id,
        submit_order_product.quantity,
        product_price,
        'product',
        new_order_code
    )
    RETURNING order_id INTO new_order_id;
    -- Cập nhật tồn kho và số lượng đã bán
    UPDATE public.products
    SET 
        stock_count = stock_count - submit_order_product.quantity,
        sold_count = sold_count + submit_order_product.quantity,
        update_at = CURRENT_TIMESTAMP
    WHERE public.products.product_id = submit_order_product.product_id;
        -- Cập nhật các bản ghi trong bảng `product_items` trong hàm submit_order_product
    WITH cte AS (
        SELECT pi.product_item_id
        FROM public.product_items pi
        WHERE pi.product_id = submit_order_product.product_id
          AND pi.status = 'notsale'
        ORDER BY pi.create_at ASC
        LIMIT submit_order_product.quantity
    )
    UPDATE public.product_items
    SET 
        status = 'sale',
        sale_at = CURRENT_TIMESTAMP,
        update_at = CURRENT_TIMESTAMP
    WHERE product_item_id IN (SELECT product_item_id FROM cte);
    -- Tạo log đơn hàng
    INSERT INTO public.orders_logs (
        logs_by,
        status_before,
        status_after,
        order_id,
        change_date,
        create_at,
        update_at
    )
    VALUES (
        submit_order_product.buyer_id,
        NULL,
        'pending',
        new_order_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    -- Trả về đơn hàng vừa tạo
    RETURN QUERY 
    SELECT * FROM public.orders WHERE order_id = new_order_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Ghi log lỗi và hủy giao dịch
        RAISE LOG 'Lỗi trong submit_order_product: %', SQLERRM;
        RAISE EXCEPTION 'Giao dịch thất bại: %', SQLERRM;
END;
$_$;
CREATE FUNCTION public.submit_order_service(buyer_id uuid, seller_id uuid, product_id uuid, quantity integer, coupon_value numeric DEFAULT NULL::numeric, complete_date_service timestamp without time zone DEFAULT NULL::timestamp without time zone) RETURNS SETOF public.orders
    LANGUAGE plpgsql
    AS $_$
DECLARE
    total_amount numeric(10,2);
    product_price numeric(10,2);
    buyer_balance numeric(10,2);
    new_order_id uuid;
    store_seller_id uuid;
    final_amount numeric(10,2);
    store_id uuid;
    new_order_code char(6);    
BEGIN
    -- Kiểm tra tính hợp lệ của buyer_id, seller_id, product_id
    IF buyer_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = buyer_id) THEN
        RAISE EXCEPTION 'buyer_id không hợp lệ hoặc không tồn tại';
    END IF;
    IF seller_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.stores WHERE public.stores.seller_id = submit_order_service.seller_id) THEN
        RAISE EXCEPTION 'seller_id không hợp lệ hoặc không tồn tại';
    END IF;
    IF product_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.products WHERE public.products.product_id = submit_order_service.product_id) THEN
        RAISE EXCEPTION 'product_id không hợp lệ hoặc không tồn tại';
    END IF;
    -- Kiểm tra service có tồn tại và lấy thông tin
    SELECT 
        p.price,
        s.seller_id,
        s.store_id
    INTO 
        product_price,
        store_seller_id,
        store_id
    FROM public.products p
    JOIN public.stores s ON p.store_id = s.store_id
    WHERE p.product_id = submit_order_service.product_id
    AND p.is_service = true;  -- Đảm bảo đây là service
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy service hoặc sản phẩm này không phải là service';
    END IF;
    -- Kiểm tra ngày hoàn thành service
    IF complete_date_service IS NULL THEN
        RAISE EXCEPTION 'Ngày hoàn thành service không được để trống';
    END IF;
    IF complete_date_service <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Ngày hoàn thành service phải lớn hơn ngày hiện tại';
    END IF;
    -- Xác minh người bán
    IF store_seller_id IS DISTINCT FROM submit_order_service.seller_id THEN
        RAISE EXCEPTION 'Người bán không hợp lệ cho service này';
    END IF;
    -- Tính tổng số tiền
    total_amount := product_price * submit_order_service.quantity;
    -- Áp dụng mã giảm giá nếu có
    IF coupon_value IS NOT NULL AND coupon_value > 0 THEN
        final_amount := total_amount * (1 - coupon_value / 100);
    ELSE
        final_amount := total_amount;
    END IF;
    -- Kiểm tra số dư người mua
    SELECT balance INTO buyer_balance
    FROM public.users u
    WHERE u.user_id = submit_order_service.buyer_id;
    IF buyer_balance < final_amount THEN
        RAISE EXCEPTION 'Số dư không đủ. Cần: %, Có sẵn: %',
            final_amount, buyer_balance;
    END IF;
    -- Trừ tiền từ tài khoản người mua
    UPDATE public.users
    SET 
        balance = balance - final_amount,
        update_at = CURRENT_TIMESTAMP
    WHERE user_id = submit_order_service.buyer_id;
    -- Tạo mã đơn hàng
    new_order_code := 'ORD' || LPAD((
        SELECT COALESCE(
            (SELECT MAX(CAST(SUBSTRING(order_code FROM 4) AS INTEGER)) + 1
             FROM public.orders
             WHERE order_code ~ '^ORD[0-9]{3}$'),
            1
        )
    )::text, 3, '0');
    -- Kiểm tra xem mã vừa tạo đã tồn tại chưa
    WHILE EXISTS (
        SELECT 1 
        FROM public.orders 
        WHERE order_code = new_order_code
    ) LOOP
        -- Nếu đã tồn tại, tăng số cuối lên 1 và thử lại
        new_order_code := 'ORD' || LPAD(
            (CAST(SUBSTRING(new_order_code FROM 4) AS INTEGER) + 1)::text, 
            3, 
            '0'
        );
    END LOOP;
    -- Thêm đơn hàng vào bảng `orders`
    INSERT INTO public.orders (
        order_id,
        buyer_id,
        order_date,
        total_amount,
        order_status,
        create_at,
        update_at,
        product_id,
        quantity,
        price,
        order_type,
        order_code,
        complete_date_service  -- Thêm ngày hoàn thành service
    )
    VALUES (
        gen_random_uuid(),
        submit_order_service.buyer_id,
        CURRENT_TIMESTAMP,
        final_amount,
        'pending',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        submit_order_service.product_id,
        submit_order_service.quantity,
        product_price,
        'service',
        new_order_code,
        complete_date_service
    )
    RETURNING order_id INTO new_order_id;
    -- Tạo log đơn hàng
    INSERT INTO public.orders_logs (
        logs_by,
        status_before,
        status_after,
        order_id,
        change_date,
        create_at,
        update_at
    )
    VALUES (
        submit_order_service.buyer_id,
        NULL,
        'pending',
        new_order_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    -- Trả về đơn hàng vừa tạo
    RETURN QUERY 
    SELECT * FROM public.orders WHERE order_id = new_order_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Ghi log lỗi và hủy giao dịch
        RAISE LOG 'Lỗi trong submit_order_service: %', SQLERRM;
        RAISE EXCEPTION 'Giao dịch thất bại: %', SQLERRM;
END;
$_$;
CREATE FUNCTION public.submit_order_test(buyer_id uuid, product_id uuid, quantity integer, coupon_id uuid DEFAULT NULL::uuid, discount numeric DEFAULT 0, store_id uuid DEFAULT NULL::uuid, input_total_amount numeric DEFAULT NULL::numeric) RETURNS TABLE(order_id uuid, total_amount numeric, message text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    product_price numeric(10,2);
    available_stock numeric;
    new_order_id uuid;
    final_amount numeric(10,2);
    product_store_id uuid;
    coupon_discount numeric;
    coupon_store_id uuid;
    user_status public.user_status;
    store_status public.store_status;
    coupon_status text;
BEGIN
    -- Kiểm tra trạng thái user
    SELECT status INTO user_status
    FROM public.users
    WHERE user_id = buyer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User không tồn tại';
    END IF;
    IF user_status != 'active' THEN
        RAISE EXCEPTION 'User không trong trạng thái active';
    END IF;
    -- Kiểm tra sản phẩm và lấy thông tin
    SELECT 
        price, 
        stock_count,
        p.store_id,
        s.status
    INTO 
        product_price, 
        available_stock,
        product_store_id,
        store_status
    FROM public.products p
    JOIN public.stores s ON p.store_id = s.store_id
    WHERE p.product_id = product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sản phẩm không tồn tại';
    END IF;
    -- Kiểm tra store status
    IF store_status != 'active' THEN
        RAISE EXCEPTION 'Store không trong trạng thái active';
    END IF;
    -- Kiểm tra store_id nếu được cung cấp
    IF store_id IS NOT NULL AND store_id != product_store_id THEN
        RAISE EXCEPTION 'Store ID không khớp với sản phẩm';
    END IF;
    -- Kiểm tra số lượng hợp lệ
    IF quantity <= 0 THEN
        RAISE EXCEPTION 'Số lượng phải lớn hơn 0';
    END IF;
    -- Kiểm tra tồn kho
    IF available_stock < quantity THEN
        RAISE EXCEPTION 'Số lượng tồn kho không đủ (Còn: %)', available_stock;
    END IF;
    -- Kiểm tra và áp dụng coupon nếu có
    IF coupon_id IS NOT NULL THEN
        SELECT 
            discount_value,
            store_id,
            CASE 
                WHEN NOW() < start_date THEN 'not_started'
                WHEN NOW() > end_date THEN 'expired'
                ELSE 'valid'
            END INTO 
            coupon_discount,
            coupon_store_id,
            coupon_status
        FROM public.coupons
        WHERE coupon_id = coupon_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Coupon không tồn tại';
        END IF;
        IF coupon_status = 'not_started' THEN
            RAISE EXCEPTION 'Coupon chưa có hiệu lực';
        END IF;
        IF coupon_status = 'expired' THEN
            RAISE EXCEPTION 'Coupon đã hết hạn';
        END IF;
        IF coupon_store_id != product_store_id THEN
            RAISE EXCEPTION 'Coupon không áp dụng cho store này';
        END IF;
        -- Sử dụng giá trị discount từ coupon nếu có
        discount := COALESCE(coupon_discount, discount);
    END IF;
    -- Tính tổng tiền
    IF input_total_amount IS NULL THEN
        final_amount := product_price * quantity;
    ELSE
        final_amount := input_total_amount;
    END IF;
    -- Áp dụng giảm giá
    IF discount > 0 THEN
        IF discount >= 100 THEN
            RAISE EXCEPTION 'Discount không thể >= 100%%';
        END IF;
        final_amount := final_amount * (1 - discount / 100);
    END IF;
    -- Bắt đầu transaction
    BEGIN
        -- Chèn đơn hàng
        INSERT INTO public.orders (
            order_id, 
            buyer_id, 
            order_date, 
            total_amount, 
            product_id, 
            quantity, 
            create_at, 
            update_at, 
            coupon_id, 
            store_id,
            order_status
        )
        VALUES (
            gen_random_uuid(), 
            buyer_id, 
            CURRENT_TIMESTAMP, 
            final_amount, 
            product_id, 
            quantity, 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP, 
            coupon_id, 
            COALESCE(store_id, product_store_id),
            'pending'
        )
        RETURNING order_id INTO new_order_id;
        -- Cập nhật tồn kho
        UPDATE public.products
        SET 
            stock_count = stock_count - quantity,
            sold_count = COALESCE(sold_count, 0) + quantity,
            update_at = CURRENT_TIMESTAMP
        WHERE product_id = product_id;
        -- Cập nhật store metrics
        UPDATE public.stores
        SET 
            total_stock_count = total_stock_count - quantity,
            total_sold_count = total_sold_count + quantity,
            update_at = CURRENT_TIMESTAMP
        WHERE store_id = product_store_id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Lỗi khi tạo transaction: %', SQLERRM;
    END;
    -- Trả về thông tin đơn hàng vừa tạo
    RETURN QUERY
    SELECT 
        new_order_id AS order_id,
        final_amount AS total_amount,
        'Transaction created successfully' AS message;
END;
$$;
CREATE FUNCTION public.submit_order_v2(buyer_id uuid, seller_id uuid, product_id uuid, quantity integer, coupon_value numeric DEFAULT NULL::numeric) RETURNS SETOF public.orders
    LANGUAGE plpgsql
    AS $_$
DECLARE
    total_amount numeric(10,2);
    product_price numeric(10,2);
    available_stock integer;
    buyer_balance numeric(10,2);
    new_order_id uuid;
    store_seller_id uuid;
    final_amount numeric(10,2);
    store_id uuid;
    new_order_code char(6);    
BEGIN
    -- Kiểm tra tính hợp lệ của buyer_id, seller_id, product_id
    IF buyer_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = buyer_id) THEN
        RAISE EXCEPTION 'buyer_id không hợp lệ hoặc không tồn tại';
    END IF;
    IF seller_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.stores WHERE public.stores.seller_id = submit_order_v2.seller_id) THEN
        RAISE EXCEPTION 'seller_id không hợp lệ hoặc không tồn tại';
    END IF;
    IF product_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.products WHERE public.products.product_id = submit_order_v2.product_id) THEN
        RAISE EXCEPTION 'product_id không hợp lệ hoặc không tồn tại';
    END IF;
    -- Kiểm tra sản phẩm có tồn tại và lấy thông tin
    SELECT 
        p.price, 
        p.stock_count,
        s.seller_id,
        s.store_id
    INTO 
        product_price, 
        available_stock,
        store_seller_id,
        store_id
    FROM public.products p
    JOIN public.stores s ON p.store_id = s.store_id
    WHERE p.product_id = submit_order_v2.product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy sản phẩm';
    END IF;
    -- Xác minh người bán
    IF store_seller_id IS DISTINCT FROM submit_order_v2.seller_id THEN
        RAISE EXCEPTION 'Người bán không hợp lệ cho sản phẩm này';
    END IF;
    -- Kiểm tra tồn kho
    IF available_stock < submit_order_v2.quantity THEN
        RAISE EXCEPTION 'Hàng tồn kho không đủ. Có sẵn: %, Yêu cầu: %', 
            available_stock, submit_order_v2.quantity;
    END IF;
    -- Tính tổng số tiền
    total_amount := product_price * submit_order_v2.quantity;
    -- Áp dụng mã giảm giá nếu có
    IF coupon_value IS NOT NULL AND coupon_value > 0 THEN
        final_amount := total_amount * (1 - coupon_value / 100);
    ELSE
        final_amount := total_amount;
    END IF;
    -- Kiểm tra số dư người mua
    SELECT balance INTO buyer_balance
    FROM public.users u
    WHERE u.user_id = submit_order_v2.buyer_id;
    IF buyer_balance < final_amount THEN
        RAISE EXCEPTION 'Số dư không đủ. Cần: %, Có sẵn: %',
            final_amount, buyer_balance;
    END IF;
    -- Trừ tiền từ tài khoản người mua
    UPDATE public.users
    SET 
        balance = balance - final_amount,
        update_at = CURRENT_TIMESTAMP
    WHERE user_id = submit_order_v2.buyer_id;
    -- Tạo mã đơn hàng
    new_order_code := 'ORD' || LPAD((
        SELECT COALESCE(
            (SELECT MAX(CAST(SUBSTRING(order_code FROM 4) AS INTEGER)) + 1
             FROM public.orders
             WHERE order_code ~ '^ORD[0-9]{3}$'),
            1
        )
    )::text, 3, '0');
    -- Kiểm tra xem mã vừa tạo đã tồn tại chưa
    WHILE EXISTS (
        SELECT 1 
        FROM public.orders 
        WHERE order_code = new_order_code
    ) LOOP
    -- Nếu đã tồn tại, tăng số cuối lên 1 và thử lại
    new_order_code := 'ORD' || LPAD(
        (CAST(SUBSTRING(new_order_code FROM 4) AS INTEGER) + 1)::text, 
            3, 
            '0'
        );
    END LOOP;
    -- Thêm đơn hàng vào bảng `orders`
    INSERT INTO public.orders (
        order_id,
        buyer_id,
        order_date,
        total_amount,
        order_status,
        create_at,
        update_at,
        product_id,
        quantity,
        price,
        order_type,
        order_code
    )
    VALUES (
        gen_random_uuid(),
        submit_order_v2.buyer_id,
        CURRENT_TIMESTAMP,
        final_amount,
        'pending',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        submit_order_v2.product_id,
        submit_order_v2.quantity,
        product_price,
        'product',
        new_order_code
    )
    RETURNING order_id INTO new_order_id;
    -- Cập nhật tồn kho và số lượng đã bán
    UPDATE public.products
    SET 
        stock_count = stock_count - submit_order_v2.quantity,
        sold_count = sold_count + submit_order_v2.quantity,
        update_at = CURRENT_TIMESTAMP
    WHERE public.products.product_id = submit_order_v2.product_id;
        -- Cập nhật các bản ghi trong bảng `product_items` trong hàm submit_order_v2
    WITH cte AS (
        SELECT pi.product_item_id
        FROM public.product_items pi
        WHERE pi.product_id = submit_order_v2.product_id
          AND pi.status = 'notsale'
        ORDER BY pi.create_at ASC
        LIMIT submit_order_v2.quantity
    )
    UPDATE public.product_items
    SET 
        status = 'sale',
        sale_at = CURRENT_TIMESTAMP,
        update_at = CURRENT_TIMESTAMP
    WHERE product_item_id IN (SELECT product_item_id FROM cte);
    -- Tạo log đơn hàng
    INSERT INTO public.orders_logs (
        logs_by,
        status_before,
        status_after,
        order_id,
        change_date,
        create_at,
        update_at
    )
    VALUES (
        submit_order_v2.buyer_id,
        NULL,
        'pending',
        new_order_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    -- Trả về đơn hàng vừa tạo
    RETURN QUERY 
    SELECT * FROM public.orders WHERE order_id = new_order_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Ghi log lỗi và hủy giao dịch
        RAISE LOG 'Lỗi trong submit_order_v2: %', SQLERRM;
        RAISE EXCEPTION 'Giao dịch thất bại: %', SQLERRM;
END;
$_$;
CREATE FUNCTION public.update_deposit_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_log_amount numeric;
  deposit_amount numeric;
BEGIN
  -- Tính tổng amount từ deposit_log
  SELECT COALESCE(SUM(amount), 0)
  INTO total_log_amount
  FROM deposit_logs
  WHERE deposit_id = NEW.deposit_id;
  -- Lấy amount từ deposit
  SELECT amount
  INTO deposit_amount
  FROM deposit
  WHERE deposit_id = NEW.deposit_id;
  -- So sánh và update status nếu bằng nhau
  IF total_log_amount = deposit_amount THEN
    UPDATE deposits
    SET deposit_status = 'completed',
        update_at = NOW()
    WHERE deposit_id = NEW.deposit_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.update_deposit_status(deposit_id uuid) RETURNS TABLE(status text)
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_log_amount numeric;
  deposit_amount numeric;
BEGIN
  -- Tính tổng amount từ deposit_logs
  SELECT COALESCE(SUM(amount), 0)
  INTO total_log_amount
  FROM deposit_logs
  WHERE deposit_id = update_deposit_status.deposit_id;
  -- Lấy amount từ deposits
  SELECT amount
  INTO deposit_amount
  FROM deposits
  WHERE deposit_id = update_deposit_status.deposit_id;
  -- Cập nhật trạng thái nếu đủ tiền
  IF total_log_amount = deposit_amount THEN
    UPDATE deposits
    SET deposit_status = 'completed',
        update_at = NOW()
    WHERE deposit_id = update_deposit_status.deposit_id;
    RETURN QUERY SELECT 'completed';
  ELSE
    RETURN QUERY SELECT 'pending';
  END IF;
END;
$$;
CREATE FUNCTION public.update_reseller_commission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.order_status = 'completed' AND OLD.order_status != 'completed' THEN
        UPDATE public.reseller_orders
        SET 
            status = 'completed'::public.reseller_order_status,
            update_at = CURRENT_TIMESTAMP
        WHERE order_id = NEW.order_id;
    ELSIF NEW.order_status = 'cancelled' AND OLD.order_status != 'cancelled' THEN
        UPDATE public.reseller_orders
        SET 
            status = 'cancelled'::public.reseller_order_status,
            update_at = CURRENT_TIMESTAMP
        WHERE order_id = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$;
CREATE FUNCTION public.update_response_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Chỉ cập nhật response_date khi response được sửa và có giá trị
  IF (NEW.response IS NOT NULL AND NEW.response <> '') AND 
     (OLD.response IS NULL OR OLD.response = '' OR OLD.response <> NEW.response) THEN
    NEW.response_date = NOW();
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.update_store_after_purchase() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Khi người dùng mua sản phẩm, giảm stock_count và tăng sold_count
  DECLARE
    stock_change numeric;
    sold_change numeric;
  BEGIN
    -- Cập nhật stock_count của sản phẩm (giảm đi)
    stock_change = OLD.stock_count - NEW.stock_count;
    -- Cập nhật sold_count của sản phẩm (tăng lên)
    sold_change = NEW.sold_count - OLD.sold_count;
    -- Cập nhật stock_count của cửa hàng (tăng hoặc giảm tương ứng)
    UPDATE stores
    SET total_stock_count = COALESCE(total_stock_count, 0) + stock_change,
        total_sold_count = COALESCE(total_sold_count, 0) + sold_change
    WHERE store_id = NEW.store_id;
    RETURN NEW;
  END;
END;
$$;
CREATE FUNCTION public.update_store_stock_and_sold_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE NOTICE 'Trigger Operation: %, Old: %, New: %', TG_OP, OLD, NEW;
  -- Nếu là INSERT mới
  IF (TG_OP = 'INSERT') THEN
    RAISE NOTICE 'Processing INSERT - Store ID: %, Stock: %, Sold: %', 
                 NEW.store_id, NEW.stock_count, NEW.sold_count;
    UPDATE stores
    SET 
      total_stock_count = COALESCE(total_stock_count, 0) + COALESCE(NEW.stock_count, 0),
      total_sold_count = COALESCE(total_sold_count, 0) + COALESCE(NEW.sold_count, 0)
    WHERE store_id = NEW.store_id;
  -- Nếu là UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    RAISE NOTICE 'Processing UPDATE - Store ID: %, Old Stock: %, New Stock: %, Old Sold: %, New Sold: %', 
                 NEW.store_id, OLD.stock_count, NEW.stock_count, OLD.sold_count, NEW.sold_count;
    -- Cập nhật stock_count nếu có thay đổi
    IF COALESCE(NEW.stock_count, 0) != COALESCE(OLD.stock_count, 0) THEN
      UPDATE stores
      SET total_stock_count = COALESCE(total_stock_count, 0) + (COALESCE(NEW.stock_count, 0) - COALESCE(OLD.stock_count, 0))
      WHERE store_id = NEW.store_id;
    END IF;
    -- Cập nhật sold_count nếu có thay đổi
    IF COALESCE(NEW.sold_count, 0) != COALESCE(OLD.sold_count, 0) THEN
      RAISE NOTICE 'Updating sold count for store: %', NEW.store_id;
      UPDATE stores
      SET total_sold_count = COALESCE(total_sold_count, 0) + (COALESCE(NEW.sold_count, 0) - COALESCE(OLD.sold_count, 0))
      WHERE store_id = NEW.store_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.update_store_stock_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  DECLARE
    stock_change numeric;
  BEGIN	
    -- Kiểm tra nếu stock_count thay đổi
    IF (TG_OP = 'UPDATE') THEN
      -- Tính toán sự thay đổi stock_count (có thể là tăng hoặc giảm)
      stock_change = NEW.stock_count - OLD.stock_count;
      -- Nếu stock_count giảm (stock_count cũ lớn hơn mới), giảm total_stock_count của store
      -- Nếu stock_count tăng, tăng total_stock_count của store
      UPDATE stores
      SET total_stock_count = COALESCE(total_stock_count, 0) + stock_change
      WHERE store_id = NEW.store_id;
    END IF;
  END;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.update_store_stock_on_product_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_store_stock INTEGER;
    new_store_stock INTEGER;
BEGIN
    -- Lấy giá trị total_stock_count hiện tại của store
    SELECT total_stock_count INTO old_store_stock
    FROM stores 
    WHERE store_id = OLD.store_id;
    -- Cập nhật total_stock_count
    UPDATE stores
    SET total_stock_count = COALESCE(total_stock_count, 0) - COALESCE(OLD.stock_count, 0)
    WHERE store_id = OLD.store_id
    RETURNING total_stock_count INTO new_store_stock;
    -- Log thông tin để debug
    INSERT INTO delete_product_logs (
        store_id, 
        product_id, 
        old_product_stock,
        old_store_total_stock,
        new_store_total_stock
    )
    VALUES (
        OLD.store_id,
        OLD.product_id,
        OLD.stock_count,
        old_store_stock,
        new_store_stock
    );
    RETURN OLD;
END;
$$;
CREATE FUNCTION public.update_store_stock_on_product_item_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_stock integer;
BEGIN
  -- Log thông tin trước khi xóa
  INSERT INTO trigger_logs (operation, item_id, product_id, status, old_stock)
  VALUES ('DELETE', OLD.product_item_id, OLD.product_id, OLD.status,
          (SELECT stock_count FROM products WHERE product_id = OLD.product_id));
  -- Chỉ update stock khi status là notsale
  IF OLD.status = 'notsale' THEN
    -- Update stock_count
    UPDATE products
    SET stock_count = stock_count - 1
    WHERE product_id = OLD.product_id;
    -- Log sau khi update
    UPDATE trigger_logs 
    SET new_stock = (SELECT stock_count FROM products WHERE product_id = OLD.product_id)
    WHERE id = currval('trigger_logs_id_seq');
  END IF;
  RETURN OLD;
END;
$$;
CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;
CREATE TABLE public.addresses (
    address_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    address text NOT NULL,
    network public.network_code NOT NULL,
    create_at timestamp without time zone DEFAULT now(),
    update_at timestamp without time zone DEFAULT now(),
    network_name character varying(50)
);
CREATE TABLE public.bids (
    bid_id uuid NOT NULL,
    position_id uuid,
    bid_amount numeric(10,2),
    bid_date timestamp with time zone,
    bid_status public.bid_status,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    store_id uuid
);
CREATE TABLE public.blog_author_username (
    author_username character varying
);
CREATE TABLE public.blog_comments (
    comment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_content text,
    sent_date timestamp with time zone,
    blog_id character varying(36),
    user_id uuid,
    is_deleted boolean,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    parent_id uuid,
    is_liked integer
);
CREATE TABLE public.blog_tags (
    blog_id character varying(24) NOT NULL,
    tag_id uuid NOT NULL,
    create_at timestamp without time zone,
    update_at timestamp without time zone
);
CREATE TABLE public.blogs (
    blog_id character varying(36) NOT NULL,
    title character varying,
    posting_day timestamp with time zone,
    description character varying,
    user_id uuid,
    donate_amount numeric(10,2) DEFAULT 0,
    donation_count integer DEFAULT 0,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    author_username character varying,
    slug character varying,
    email character varying,
    ghost_id character varying(100),
    images character varying,
    is_deleted timestamp with time zone
);
CREATE TABLE public.categories (
    category_id uuid NOT NULL,
    category_name character varying,
    type character varying,
    parent_category_id uuid,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    slug character varying,
    images_url character varying(255),
    description character varying(255),
    keywords text,
    status public.category_status DEFAULT 'active'::public.category_status,
    discounted_product_type_id uuid
);
CREATE TABLE public.complain_order (
    complain_id uuid DEFAULT gen_random_uuid() NOT NULL,
    content text NOT NULL,
    image character varying,
    created_at date DEFAULT now() NOT NULL,
    updated_at date DEFAULT now() NOT NULL,
    order_id uuid NOT NULL,
    status character varying DEFAULT 'pending'::character varying
);
CREATE TABLE public.configs (
    name text NOT NULL,
    value text NOT NULL,
    create_at timestamp with time zone DEFAULT now(),
    update_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.coupons (
    coupon_id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_code character varying,
    discount_type character varying,
    discount_value numeric(10,2),
    usage_limit integer,
    create_at timestamp without time zone DEFAULT now(),
    update_at timestamp without time zone DEFAULT now(),
    store_id uuid,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    description text,
    discount_rate integer,
    maximum_amount integer,
    unlimited_use boolean,
    deleted boolean DEFAULT false
);
CREATE TABLE public.stores (
    store_id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid,
    store_name character varying,
    description text,
    average_rating double precision,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    one_star integer DEFAULT 0,
    two_star integer DEFAULT 0,
    three_star integer DEFAULT 0,
    four_star integer DEFAULT 0,
    five_star integer DEFAULT 0,
    avatar character varying,
    category_id uuid,
    store_tag character varying(255),
    store_price numeric(10,2),
    slug character varying,
    sub_title character varying,
    rating_total integer DEFAULT 0,
    total_stock_count integer DEFAULT 0,
    total_sold_count integer DEFAULT 0,
    min_price numeric(10,2) DEFAULT 1,
    max_price numeric(10,2) DEFAULT 1,
    favorite_count integer DEFAULT 0,
    status public.store_status DEFAULT 'pending'::public.store_status,
    allow_reseller boolean,
    duplicate_product boolean,
    private_warehouse boolean,
    refund_rating integer,
    short_description character varying(255)
);
CREATE VIEW public.coupons_view AS
 SELECT c.coupon_id,
    c.coupon_code,
    c.discount_type,
    c.discount_value,
    c.create_at,
    c.update_at,
    c.store_id,
    c.start_date,
    c.unlimited_use,
    c.end_date,
    c.description,
    c.discount_rate,
    c.maximum_amount,
    c.usage_limit,
    c.deleted,
    s.store_name,
    s.seller_id,
    ((c.usage_limit > 0) AND ((CURRENT_TIMESTAMP >= c.start_date) AND (CURRENT_TIMESTAMP <= c.end_date))) AS is_active
   FROM (public.coupons c
     JOIN public.stores s ON ((c.store_id = s.store_id)));
CREATE TABLE public.delete_product_logs (
    id integer NOT NULL,
    store_id text,
    product_id text,
    old_product_stock integer,
    old_store_total_stock integer,
    new_store_total_stock integer,
    created_at timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.delete_product_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.delete_product_logs_id_seq OWNED BY public.delete_product_logs.id;
CREATE TABLE public.deposit_logs (
    log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    deposit_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    status text NOT NULL,
    transaction_id character varying,
    payment_method character varying,
    error_message text,
    processed_at timestamp with time zone DEFAULT now(),
    create_at timestamp with time zone DEFAULT now(),
    update_at timestamp with time zone DEFAULT now(),
    txhash character varying(255),
    payload text,
    order_id text
);
CREATE TABLE public.deposits (
    deposit_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    amount numeric(10,2),
    deposit_status public.deposit_status,
    deposit_date timestamp with time zone,
    description text,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    transaction_id uuid NOT NULL
);
CREATE VIEW public.deposit_log_view AS
 SELECT d.deposit_id,
    d.user_id,
    d.amount AS deposit_amount,
    d.deposit_status,
    d.deposit_date,
    d.description,
    d.create_at AS deposit_create_at,
    d.update_at AS deposit_update_at,
    d.transaction_id AS deposit_transaction_id,
    dl.log_id,
    dl.amount AS log_amount,
    dl.status AS log_status,
    dl.transaction_id AS log_transaction_id,
    dl.payment_method,
    dl.error_message,
    dl.processed_at AS log_processed_at,
    dl.txhash,
    dl.payload,
    dl.order_id AS log_order_id,
    dl.create_at AS log_create_at,
    dl.update_at AS log_update_at
   FROM (public.deposits d
     LEFT JOIN public.deposit_logs dl ON ((d.deposit_id = dl.deposit_id)));
CREATE TABLE public.discounted_product_type (
    discounted_product_type_id uuid DEFAULT gen_random_uuid() NOT NULL,
    type_name character varying NOT NULL,
    discount_percentage numeric NOT NULL,
    description text,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    category_id uuid
);
CREATE TABLE public.duplicate_check_results (
    id integer NOT NULL,
    run_at timestamp without time zone DEFAULT now(),
    items_checked integer,
    duplicates_found integer,
    execution_time interval,
    status text
);
CREATE SEQUENCE public.duplicate_check_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.duplicate_check_results_id_seq OWNED BY public.duplicate_check_results.id;
CREATE TABLE public.products (
    product_id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_name character varying,
    price numeric(10,2),
    listing_date timestamp with time zone,
    end_date timestamp with time zone,
    status character varying,
    has_discount integer,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    store_id uuid,
    start_is_featured timestamp without time zone,
    end_is_featured timestamp without time zone,
    complete_date_service timestamp without time zone,
    sold_count integer,
    stock_count numeric,
    is_service boolean DEFAULT false NOT NULL,
    is_enabled boolean DEFAULT false,
    use_private_warehouse boolean DEFAULT false
);
CREATE TABLE public.users (
    user_id uuid NOT NULL,
    username character varying NOT NULL,
    password character varying NOT NULL,
    images character varying,
    email character varying NOT NULL,
    last_login timestamp with time zone,
    balance numeric(10,2) DEFAULT 0,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    google_account_id character varying,
    two_factor_secret text,
    login_failed_count integer,
    role public.role_rule,
    seller_since timestamp without time zone,
    full_name character varying(255),
    two_factor_enabled boolean,
    status public.user_status DEFAULT 'active'::public.user_status,
    referral_code character(6),
    held_balance numeric DEFAULT '0'::numeric,
    slug text
);
CREATE VIEW public.listing_orders AS
 SELECT o.order_id,
    o.buyer_id,
    o.order_date,
    o.total_amount,
    o.order_status,
    o.create_at,
    o.update_at,
    o.product_id,
    o.quantity,
    o.price,
    o.order_code,
    o.coupon_id,
    o.referral_code,
    o.order_type,
    u.username AS buyer_name,
    p.store_id,
    s.store_name,
    s.seller_id,
    seller.username AS seller_name,
    p.product_name,
    p.price AS product_price,
    p.status AS product_status,
    p.sold_count,
    p.stock_count,
    p.is_service,
    p.has_discount
   FROM (((((public.orders o
     LEFT JOIN public.users u ON ((o.buyer_id = u.user_id)))
     LEFT JOIN public.products p ON ((o.product_id = p.product_id)))
     LEFT JOIN public.stores s ON ((p.store_id = s.store_id)))
     LEFT JOIN public.users seller ON ((s.seller_id = seller.user_id)))
     LEFT JOIN public.coupons c ON ((o.coupon_id = c.coupon_id)));
CREATE TABLE public.wishlist (
    wishlist_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    added_date timestamp with time zone DEFAULT now() NOT NULL,
    create_at timestamp with time zone DEFAULT now() NOT NULL,
    update_at timestamp with time zone DEFAULT now() NOT NULL,
    store_id uuid
);
CREATE VIEW public.listing_stores AS
 SELECT s.store_id,
    s.store_name,
    s.avatar,
    s.slug,
    s.sub_title,
    s.average_rating,
    s.rating_total,
    s.total_stock_count AS stock,
    s.total_sold_count AS sold,
    s.store_price,
    s.duplicate_product,
    s.status,
    c.category_name,
    c.slug AS category_slug,
    c.type AS category_type,
    c_parent.category_name AS parent_category_name,
    c_parent.slug AS parent_category_slug,
    u.user_id AS seller_id,
    u.username AS seller_name,
    u.images AS seller_avatar,
    ( SELECT max(p.price) AS max
           FROM public.products p
          WHERE ((p.store_id = s.store_id) AND ((p.status)::text = 'sale'::text))) AS highest_price,
    ( SELECT min(p.price) AS min
           FROM public.products p
          WHERE ((p.store_id = s.store_id) AND ((p.status)::text = 'sale'::text))) AS lowest_price,
    ( SELECT count(*) AS count
           FROM public.products p
          WHERE (p.store_id = s.store_id)) AS product_count,
    ( SELECT array_agg(w.wishlist_id) AS array_agg
           FROM public.wishlist w
          WHERE (w.store_id = s.store_id)) AS wishlist_ids,
    s.store_tag
   FROM (((public.stores s
     LEFT JOIN public.users u ON ((s.seller_id = u.user_id)))
     LEFT JOIN public.categories c ON ((s.category_id = c.category_id)))
     LEFT JOIN public.categories c_parent ON ((c.parent_category_id = c_parent.category_id)));
CREATE TABLE public.notifications (
    notification_id uuid NOT NULL,
    user_id uuid,
    notification_type character varying,
    content text,
    sent_date timestamp with time zone,
    is_read boolean,
    create_at timestamp without time zone,
    update_at timestamp without time zone
);
CREATE TABLE public.orders_logs (
    log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    logs_by uuid NOT NULL,
    status_before text,
    status_after text,
    change_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    order_id uuid NOT NULL,
    create_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    update_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE public.payment_results (
    id integer NOT NULL,
    order_id uuid,
    message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE SEQUENCE public.payment_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.payment_results_id_seq OWNED BY public.payment_results.id;
CREATE TABLE public.positions (
    position_id uuid NOT NULL,
    position_name character varying,
    description text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    status character varying,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    winner_stores uuid
);
CREATE TABLE public.product_items (
    product_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    data_text text,
    content character varying(255),
    status public.sale_status,
    exported_at timestamp without time zone,
    sale_at timestamp without time zone,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    serial_key character varying(255),
    expiration_date timestamp with time zone,
    is_duplicate boolean DEFAULT false,
    checked_at timestamp with time zone
);
CREATE TABLE public.product_upload_logs (
    product_upload_logs_id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_size bigint NOT NULL,
    file_name text NOT NULL,
    valid_row_count integer NOT NULL,
    invalid_row_count integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    status text NOT NULL
);
CREATE TABLE public.reports (
    report_id uuid NOT NULL,
    user_id uuid,
    report_type character varying,
    description text,
    report_date timestamp with time zone,
    status character varying,
    store_id uuid,
    create_at timestamp without time zone,
    update_at timestamp without time zone
);
CREATE TABLE public.reseller_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reseller_id uuid NOT NULL,
    order_id uuid NOT NULL,
    commission_amount numeric(10,2),
    status public.reseller_order_status DEFAULT 'pending'::public.reseller_order_status,
    create_at timestamp without time zone DEFAULT now(),
    update_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.resellers (
    reseller_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    store_id uuid,
    commission_rate numeric(5,2),
    created_at timestamp with time zone,
    create_at timestamp without time zone DEFAULT now(),
    update_at timestamp without time zone DEFAULT now(),
    status public.reseller_status DEFAULT 'pending'::public.reseller_status,
    request_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    approval_date timestamp with time zone,
    is_active boolean DEFAULT true,
    notes text,
    link character varying
);
CREATE VIEW public.reseller_orders_view AS
 SELECT ro.id,
    ro.order_id,
    ro.reseller_id,
    ro.commission_amount,
    ro.status,
    ro.create_at,
    ro.update_at,
    o.order_date,
    o.total_amount,
    o.quantity,
    o.buyer_id,
    p.product_id,
    p.product_name,
    p.price AS unit_price,
    s.store_id,
    s.store_name,
    r.commission_rate,
    u.email AS buyer_email
   FROM (((((public.reseller_orders ro
     JOIN public.orders o ON ((ro.order_id = o.order_id)))
     JOIN public.products p ON ((o.product_id = p.product_id)))
     JOIN public.stores s ON ((p.store_id = s.store_id)))
     JOIN public.resellers r ON ((ro.reseller_id = r.reseller_id)))
     JOIN public.users u ON ((o.buyer_id = u.user_id)));
CREATE VIEW public.reseller_store_links AS
 SELECT r.reseller_id,
    r.store_id,
    r.status,
    r.is_active,
    r.commission_rate,
    u.referral_code,
    s.store_name,
    s.slug AS store_slug,
    concat('/products/', s.slug, '?ref=', u.referral_code) AS share_link
   FROM ((public.resellers r
     JOIN public.users u ON ((r.user_id = u.user_id)))
     JOIN public.stores s ON ((r.store_id = s.store_id)))
  WHERE ((r.status = 'approved'::public.reseller_status) AND (r.is_active = true));
CREATE TABLE public.social_media_links (
    link_id uuid NOT NULL,
    user_id uuid,
    platform character varying,
    profile_url character varying,
    connected_date timestamp with time zone,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    is_verified boolean DEFAULT false
);
CREATE TABLE public.store_ratings (
    rating_id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    user_id uuid,
    rating integer,
    review text,
    rating_date timestamp with time zone,
    create_at timestamp without time zone DEFAULT now(),
    update_at timestamp without time zone DEFAULT now(),
    response text,
    response_date timestamp with time zone,
    CONSTRAINT store_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
CREATE VIEW public.store_details AS
 SELECT s.store_id,
    s.store_name,
    s.description,
    s.sub_title,
    s.avatar,
    s.slug,
    s.average_rating,
    s.rating_total,
    s.store_tag,
    s.store_price,
    s.total_stock_count,
    s.total_sold_count,
    s.min_price,
    s.max_price,
    s.favorite_count,
    s.status,
    s.create_at AS created_at,
    s.update_at AS updated_at,
    u.user_id AS seller_id,
    u.username AS seller_username,
    u.full_name AS seller_full_name,
    u.images AS seller_avatar,
    u.seller_since,
    c.category_id,
    c.category_name,
    ( SELECT count(*) AS count
           FROM public.products p
          WHERE (p.store_id = s.store_id)) AS product_count,
    ( SELECT count(*) AS count
           FROM public.products p
          WHERE ((p.store_id = s.store_id) AND ((p.status)::text = 'sale'::text))) AS active_product_count,
    ( SELECT COALESCE(sum(o.total_amount), (0)::numeric) AS "coalesce"
           FROM (public.orders o
             JOIN public.products p ON ((o.product_id = p.product_id)))
          WHERE ((p.store_id = s.store_id) AND ((o.order_status)::text = 'completed'::text))) AS total_sales_amount,
    ( SELECT count(*) AS count
           FROM (public.orders o
             JOIN public.products p ON ((o.product_id = p.product_id)))
          WHERE (p.store_id = s.store_id)) AS total_orders,
    ( SELECT json_agg(json_build_object('rating_id', sr.rating_id, 'rating', sr.rating, 'review', sr.review, 'user_id', sr.user_id, 'username', usr.username, 'user_avatars', usr.images, 'rating_date', sr.rating_date) ORDER BY sr.rating_date DESC) AS json_agg
           FROM (public.store_ratings sr
             JOIN public.users usr ON ((sr.user_id = usr.user_id)))
          WHERE (sr.store_id = s.store_id)
         LIMIT 5) AS recent_reviews,
    ( SELECT json_build_object('reseller_id', r.reseller_id, 'commission_rate', r.commission_rate, 'status', r.status) AS json_build_object
           FROM public.resellers r
          WHERE (r.store_id = s.store_id)
         LIMIT 1) AS reseller_info,
    ( SELECT count(*) AS count
           FROM public.wishlist w
          WHERE (w.store_id = s.store_id)) AS wishlist_count,
    c.type AS category_type
   FROM ((public.stores s
     LEFT JOIN public.users u ON ((s.seller_id = u.user_id)))
     LEFT JOIN public.categories c ON ((s.category_id = c.category_id)));
CREATE TABLE public.store_registrations (
    registration_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    phone_number character varying(15) NOT NULL,
    id_card_image character varying(255) NOT NULL,
    portrait_photo character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    admin_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE VIEW public.store_sales_summary AS
 SELECT s.store_id,
    s.store_name,
    s.seller_id,
    u.username AS seller_name,
    count(o.order_id) AS total_orders,
    sum(o.total_amount) AS total_revenue,
    count(DISTINCT o.buyer_id) AS unique_customers,
    count(DISTINCT p.product_id) AS products_sold,
    COALESCE(avg(sr.rating), (0)::numeric) AS average_rating,
    count(sr.rating_id) AS rating_count,
    max(o.order_date) AS last_order_date
   FROM ((((public.stores s
     LEFT JOIN public.users u ON ((s.seller_id = u.user_id)))
     LEFT JOIN public.products p ON ((s.store_id = p.store_id)))
     LEFT JOIN public.orders o ON ((p.product_id = o.product_id)))
     LEFT JOIN public.store_ratings sr ON ((s.store_id = sr.store_id)))
  GROUP BY s.store_id, s.store_name, s.seller_id, u.username;
CREATE TABLE public.support_tickets (
    ticket_id uuid NOT NULL,
    subject character varying,
    description text,
    status public.support_ticket_status,
    priority character varying,
    assigned_to uuid,
    created_date timestamp with time zone,
    closed_date timestamp with time zone,
    create_at timestamp without time zone,
    update_at timestamp without time zone
);
CREATE TABLE public.tags (
    tag_id uuid NOT NULL,
    tag_name character varying,
    description text,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    slug character varying
);
CREATE TABLE public.trigger_logs (
    id integer NOT NULL,
    operation text,
    item_id text,
    product_id text,
    status text,
    old_stock integer,
    new_stock integer,
    created_at timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.trigger_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.trigger_logs_id_seq OWNED BY public.trigger_logs.id;
CREATE TABLE public.twofa_authenticators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    secret_key text NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    activated_at timestamp with time zone,
    last_used_at timestamp with time zone,
    device_name text,
    two_secret_key character varying
);
CREATE VIEW public.user_activity_summary AS
 SELECT u.user_id,
    u.username,
    u.email,
    u.status,
    u.last_login,
    u.create_at AS registration_date,
    count(o.order_id) AS order_count,
    count(sr.rating_id) AS review_count,
    count(st.ticket_id) AS support_ticket_count,
    count(bc.comment_id) AS blog_comment_count,
    count(d.donation_id) AS donation_count,
    count(w.wishlist_id) AS wishlist_count,
    ( SELECT count(*) AS count
           FROM public.stores s
          WHERE (s.seller_id = u.user_id)) AS store_count,
    ( SELECT count(*) AS count
           FROM public.blogs b
          WHERE (b.user_id = u.user_id)) AS blog_count
   FROM ((((((public.users u
     LEFT JOIN public.orders o ON ((u.user_id = o.buyer_id)))
     LEFT JOIN public.store_ratings sr ON ((u.user_id = sr.user_id)))
     LEFT JOIN public.support_tickets st ON ((u.user_id = st.assigned_to)))
     LEFT JOIN public.blog_comments bc ON ((u.user_id = bc.user_id)))
     LEFT JOIN public.donations d ON ((u.user_id = d.user_id)))
     LEFT JOIN public.wishlist w ON ((u.user_id = w.user_id)))
  GROUP BY u.user_id, u.username, u.email, u.status, u.last_login, u.create_at;
CREATE VIEW public.user_order_summary AS
 SELECT u.user_id,
    u.username,
    count(o.order_id) AS total_orders,
    sum(o.total_amount) AS total_spent,
    count(
        CASE
            WHEN ((o.order_status)::text = 'completed'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_orders,
    count(
        CASE
            WHEN ((o.order_status)::text = 'pending'::text) THEN 1
            ELSE NULL::integer
        END) AS pending_orders,
    max(o.order_date) AS last_order_date,
    ( SELECT count(DISTINCT p.store_id) AS count
           FROM (public.orders o2
             JOIN public.products p ON ((o2.product_id = p.product_id)))
          WHERE (o2.buyer_id = u.user_id)) AS stores_ordered_from
   FROM (public.users u
     LEFT JOIN public.orders o ON ((u.user_id = o.buyer_id)))
  GROUP BY u.user_id, u.username;
ALTER TABLE ONLY public.delete_product_logs ALTER COLUMN id SET DEFAULT nextval('public.delete_product_logs_id_seq'::regclass);
ALTER TABLE ONLY public.duplicate_check_results ALTER COLUMN id SET DEFAULT nextval('public.duplicate_check_results_id_seq'::regclass);
ALTER TABLE ONLY public.payment_results ALTER COLUMN id SET DEFAULT nextval('public.payment_results_id_seq'::regclass);
ALTER TABLE ONLY public.trigger_logs ALTER COLUMN id SET DEFAULT nextval('public.trigger_logs_id_seq'::regclass);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT accounts_email_key UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (address_id);
ALTER TABLE ONLY public.bids_history
    ADD CONSTRAINT bid_history_pkey PRIMARY KEY (history_id);
ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (bid_id);
ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_pkey PRIMARY KEY (blog_id, tag_id);
ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_ghost_id_key UNIQUE (ghost_id);
ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_pkey PRIMARY KEY (blog_id);
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);
ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (comment_id);
ALTER TABLE ONLY public.complain_order
    ADD CONSTRAINT complain_order_pkey PRIMARY KEY (complain_id);
ALTER TABLE ONLY public.configs
    ADD CONSTRAINT configs_pkey PRIMARY KEY (name);
ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (coupon_id);
ALTER TABLE ONLY public.delete_product_logs
    ADD CONSTRAINT delete_product_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.deposit_logs
    ADD CONSTRAINT deposit_logs_pkey PRIMARY KEY (log_id);
ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_pkey PRIMARY KEY (deposit_id);
ALTER TABLE ONLY public.discounted_product_type
    ADD CONSTRAINT discounted_product_type_pkey PRIMARY KEY (discounted_product_type_id);
ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (donation_id);
ALTER TABLE ONLY public.duplicate_check_results
    ADD CONSTRAINT duplicate_check_results_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);
ALTER TABLE ONLY public.orders_logs
    ADD CONSTRAINT orders_logs_pkey PRIMARY KEY (log_id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);
ALTER TABLE ONLY public.payment_results
    ADD CONSTRAINT payment_results_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (position_id);
ALTER TABLE ONLY public.product_items
    ADD CONSTRAINT product_items_pkey PRIMARY KEY (product_item_id);
ALTER TABLE ONLY public.product_upload_logs
    ADD CONSTRAINT product_upload_logs_pkey PRIMARY KEY (product_upload_logs_id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (report_id);
ALTER TABLE ONLY public.reseller_orders
    ADD CONSTRAINT reseller_orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_pkey PRIMARY KEY (reseller_id);
ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_user_id_store_id_key UNIQUE (user_id, store_id);
ALTER TABLE ONLY public.social_media_links
    ADD CONSTRAINT social_media_links_pkey PRIMARY KEY (link_id);
ALTER TABLE ONLY public.store_ratings
    ADD CONSTRAINT store_ratings_pkey PRIMARY KEY (rating_id);
ALTER TABLE ONLY public.store_registrations
    ADD CONSTRAINT store_registration_pkey PRIMARY KEY (registration_id);
ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (store_id);
ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (ticket_id);
ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);
ALTER TABLE ONLY public.trigger_logs
    ADD CONSTRAINT trigger_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.twofa_authenticators
    ADD CONSTRAINT twofa_authenticators_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.store_ratings
    ADD CONSTRAINT unique_store_user_rating UNIQUE (store_id, user_id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (wishlist_id);
ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (withdrawal_id);
CREATE INDEX idx_deposit_logs_deposit_id ON public.deposit_logs USING btree (deposit_id);
CREATE INDEX idx_deposit_logs_status ON public.deposit_logs USING btree (status);
CREATE INDEX idx_ghost_id ON public.blogs USING btree (ghost_id);
CREATE INDEX idx_orders_product_id ON public.orders USING btree (product_id);
CREATE INDEX idx_product_items_checked_at ON public.product_items USING btree (checked_at);
CREATE INDEX idx_product_items_identifier ON public.product_items USING btree (lower(TRIM(BOTH FROM split_part(data_text, '|'::text, 1))));
CREATE INDEX idx_product_items_is_duplicate ON public.product_items USING btree (is_duplicate);
CREATE INDEX idx_product_items_status ON public.product_items USING btree (status);
CREATE INDEX idx_products_store_id ON public.products USING btree (store_id);
CREATE INDEX idx_store_ratings_store_id ON public.store_ratings USING btree (store_id);
CREATE INDEX idx_wishlist_store_id ON public.wishlist USING btree (store_id);
CREATE TRIGGER enforce_address_limit BEFORE INSERT ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.check_address_limit();
CREATE TRIGGER enforce_product_limit BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.check_product_limit();
CREATE TRIGGER enforce_reseller_commission_rate BEFORE INSERT OR UPDATE ON public.resellers FOR EACH ROW EXECUTE FUNCTION public.check_reseller_commission_rate();
CREATE TRIGGER enforce_store_limit BEFORE INSERT ON public.stores FOR EACH ROW EXECUTE FUNCTION public.check_store_limit();
CREATE TRIGGER ensure_store_slug BEFORE INSERT OR UPDATE OF store_name ON public.stores FOR EACH ROW EXECUTE FUNCTION public.ensure_unique_store_slug();
CREATE TRIGGER generate_user_referral_code BEFORE INSERT ON public.users FOR EACH ROW WHEN ((new.referral_code IS NULL)) EXECUTE FUNCTION public.ensure_unique_referral_code();
CREATE TRIGGER process_order_referral_trigger AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.process_order_referral();
CREATE TRIGGER reseller_orders_view_delete INSTEAD OF DELETE ON public.reseller_orders_view FOR EACH ROW EXECUTE FUNCTION public.process_reseller_orders_view_changes();
CREATE TRIGGER reseller_orders_view_insert INSTEAD OF INSERT ON public.reseller_orders_view FOR EACH ROW EXECUTE FUNCTION public.process_reseller_orders_view_changes();
CREATE TRIGGER reseller_orders_view_update INSTEAD OF UPDATE ON public.reseller_orders_view FOR EACH ROW EXECUTE FUNCTION public.process_reseller_orders_view_changes();
CREATE TRIGGER set_response_date BEFORE UPDATE ON public.store_ratings FOR EACH ROW EXECUTE FUNCTION public.update_response_date();
CREATE TRIGGER trigger_update_reseller_commission AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_reseller_commission();
CREATE TRIGGER update_store_registration_timestamp BEFORE UPDATE ON public.store_registrations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_store_stock_and_sold_count_trigger AFTER INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_store_stock_and_sold_count();
CREATE TRIGGER update_store_stock_on_product_delete_trigger BEFORE DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_store_stock_on_product_delete();
CREATE TRIGGER update_store_stock_on_product_item_delete_trigger BEFORE DELETE ON public.product_items FOR EACH ROW EXECUTE FUNCTION public.update_store_stock_on_product_item_delete();
ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.bids_history
    ADD CONSTRAINT bid_history_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(bid_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.bids_history
    ADD CONSTRAINT bid_history_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);
ALTER TABLE ONLY public.bids_history
    ADD CONSTRAINT bids_history_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(position_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(position_id);
ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);
ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(blog_id);
ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id);
ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_email_fkey FOREIGN KEY (email) REFERENCES public.users(email);
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_discounted_product_type_id_fkey FOREIGN KEY (discounted_product_type_id) REFERENCES public.discounted_product_type(discounted_product_type_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.categories(category_id);
ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT comments_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(blog_id);
ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.complain_order
    ADD CONSTRAINT complain_order_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);
ALTER TABLE ONLY public.deposit_logs
    ADD CONSTRAINT deposit_logs_deposit_id_fkey FOREIGN KEY (deposit_id) REFERENCES public.deposits(deposit_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.discounted_product_type
    ADD CONSTRAINT discounted_product_type_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(blog_id);
ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT fk_parent_comment FOREIGN KEY (parent_id) REFERENCES public.blog_comments(comment_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(coupon_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.orders_logs
    ADD CONSTRAINT orders_logs_logs_by_fkey FOREIGN KEY (logs_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.orders_logs
    ADD CONSTRAINT orders_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);
ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_winner_id_fkey FOREIGN KEY (winner_stores) REFERENCES public.stores(store_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.product_items
    ADD CONSTRAINT product_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);
ALTER TABLE ONLY public.product_upload_logs
    ADD CONSTRAINT product_upload_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.product_upload_logs
    ADD CONSTRAINT product_upload_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.reseller_orders
    ADD CONSTRAINT reseller_orders_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);
ALTER TABLE ONLY public.reseller_orders
    ADD CONSTRAINT reseller_orders_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.resellers(reseller_id);
ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);
ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.social_media_links
    ADD CONSTRAINT social_media_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.store_ratings
    ADD CONSTRAINT store_ratings_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);
ALTER TABLE ONLY public.store_ratings
    ADD CONSTRAINT store_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.store_registrations
    ADD CONSTRAINT store_registration_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id);
ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.twofa_authenticators
    ADD CONSTRAINT twofa_authenticators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);
ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(address_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
