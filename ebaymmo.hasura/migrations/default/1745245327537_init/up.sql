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
    'ADMIN',
    'OPERATOR'
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
CREATE FUNCTION public.calculate_delta_priority(p_week_start_date date) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Tính Delta Priority
    MERGE INTO store_points AS target
    USING (
        SELECT 
            s.store_id,
            p_week_start_date AS week_start_date,
            CASE 
                WHEN s.create_at >= (p_week_start_date - INTERVAL '14 days') THEN 100
                ELSE 0
            END AS delta_priority
        FROM 
            stores s
        WHERE 
            s.status = 'active'
    ) AS source
    ON 
        target.store_id = source.store_id AND
        target.week_start_date = source.week_start_date
    WHEN MATCHED THEN
        UPDATE SET 
            delta_priority = source.delta_priority,
            updated_at = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (
            store_id, 
            week_start_date, 
            delta_revenue, 
            delta_priority, 
            delta_rating, 
            delta_traffic,
            previous_accumulated_points,
            accumulated_points, 
            current_level, 
            created_at, 
            updated_at
        )
        VALUES (
            source.store_id, 
            source.week_start_date, 
            0,
            source.delta_priority, 
            0, 
            0,
            0,
            0, 
            0, 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP
        );
    -- Log thành công
    RAISE NOTICE 'Delta Priority calculated successfully for week starting %', p_week_start_date;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error calculating delta_priority: %', SQLERRM;
END;
$$;
CREATE FUNCTION public.calculate_delta_rating(p_week_start_date date) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Tính Delta Rating
    INSERT INTO store_points (
        store_id, 
        week_start_date, 
        delta_revenue, 
        delta_priority, 
        delta_rating, 
        delta_traffic,
        previous_accumulated_points,
        accumulated_points, 
        current_level, 
        created_at, 
        updated_at
    )
    SELECT 
        sr.store_id,
        p_week_start_date AS week_start_date,
        0,  -- delta_revenue
        0,  -- delta_priority
        ROUND(COALESCE(AVG(sr.rating), 0) * COUNT(sr.rating))::INTEGER AS delta_rating,
        0,  -- delta_traffic
        0,  -- previous_accumulated_points
        0,  -- accumulated_points
        0,  -- current_level
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
    FROM 
        store_ratings sr
    WHERE 
        sr.create_at >= p_week_start_date AND 
        sr.create_at < (p_week_start_date + INTERVAL '7 days')
    GROUP BY 
        sr.store_id
    ON CONFLICT (store_id, week_start_date) 
    DO UPDATE SET 
        delta_rating = EXCLUDED.delta_rating,
        updated_at = CURRENT_TIMESTAMP;
    -- Log thành công
    RAISE NOTICE 'Delta Rating calculated successfully for week starting %', p_week_start_date;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error calculating delta_rating: %', SQLERRM;
END;
$$;
CREATE FUNCTION public.calculate_delta_revenue(p_week_start_date date) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Tính Delta Revenue
    WITH revenue_data AS (
        -- Tính tổng doanh thu các đơn hàng thành công trong tuần cho mỗi cửa hàng
        -- Lấy trực tiếp từ bảng listing_orders có sẵn store_id
        SELECT 
            store_id,
            COALESCE(SUM(total_amount), 0) AS total_revenue
        FROM 
            listing_orders
        WHERE 
            create_at >= p_week_start_date AND 
            create_at < (p_week_start_date + INTERVAL '7 days') AND
            order_status = 'successed'
        GROUP BY 
            store_id
    ),
    max_revenue AS (
        -- Tìm doanh thu cao nhất trong tuần
        SELECT MAX(total_revenue) AS max_value
        FROM revenue_data
    )
    -- Cập nhật hoặc thêm mới delta_revenue
    MERGE INTO store_points AS target
    USING (
        SELECT 
            rd.store_id,
            p_week_start_date AS week_start_date,
            CASE 
                WHEN mr.max_value > 0 THEN 
                    ROUND((rd.total_revenue::NUMERIC / mr.max_value::NUMERIC) * 200)::INTEGER
                ELSE 0
            END AS delta_revenue
        FROM 
            revenue_data rd
        CROSS JOIN 
            max_revenue mr
        WHERE 
            rd.store_id IS NOT NULL
    ) AS source
    ON 
        target.store_id = source.store_id AND
        target.week_start_date = source.week_start_date
    WHEN MATCHED THEN
        UPDATE SET 
            delta_revenue = source.delta_revenue,
            updated_at = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (
            store_id, 
            week_start_date, 
            delta_revenue, 
            delta_priority, 
            delta_rating, 
            delta_traffic,
            previous_accumulated_points,
            accumulated_points, 
            current_level, 
            created_at, 
            updated_at
        )
        VALUES (
            source.store_id, 
            source.week_start_date, 
            source.delta_revenue, 
            0, 
            0, 
            0,
            0,
            0, 
            0, 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP
        );
    -- Log thành công
    RAISE NOTICE 'Delta Revenue calculated successfully for week starting %', p_week_start_date;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error calculating delta_revenue: %', SQLERRM;
END;
$$;
CREATE FUNCTION public.calculate_delta_traffic(p_week_start_date date) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Tính Delta Traffic từ bảng store_access_logs
    INSERT INTO store_points (
        store_id, 
        week_start_date, 
        delta_revenue, 
        delta_priority, 
        delta_rating, 
        delta_traffic,
        previous_accumulated_points,
        accumulated_points, 
        current_level, 
        created_at, 
        updated_at
    )
    SELECT 
        store_id,
        p_week_start_date AS week_start_date,
        0,  -- delta_revenue
        0,  -- delta_priority
        0,  -- delta_rating
        COUNT(*) AS delta_traffic,
        0,  -- previous_accumulated_points
        0,  -- accumulated_points
        0,  -- current_level
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
    FROM 
        store_access_logs
    WHERE 
        access_date >= p_week_start_date AND 
        access_date < (p_week_start_date + INTERVAL '7 days')
    GROUP BY 
        store_id
    ON CONFLICT (store_id, week_start_date) 
    DO UPDATE SET 
        delta_traffic = EXCLUDED.delta_traffic,
        updated_at = CURRENT_TIMESTAMP;
    -- Log thành công
    RAISE NOTICE 'Delta Traffic calculated successfully for week starting %', p_week_start_date;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error calculating delta_traffic: %', SQLERRM;
END;
$$;
CREATE FUNCTION public.calculate_store_points() RETURNS TABLE(store_id uuid, week_start_date date, sales_points integer, new_store_points integer, rating_points integer, total_points integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_week_start DATE;
    store_record RECORD;
    max_sales NUMERIC;
    max_rating NUMERIC;
BEGIN
    -- Xác định ngày bắt đầu tuần hiện tại (thứ Hai)
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE;
    -- Tìm giá trị cao nhất cho mỗi tiêu chí để chuẩn hóa điểm
    SELECT COALESCE(MAX(total_sold_count), 1) INTO max_sales FROM stores;
    SELECT COALESCE(MAX(average_rating * rating_total), 1) INTO max_rating FROM stores;
    -- Xóa điểm của tuần hiện tại nếu đã tồn tại
    DELETE FROM store_points WHERE week_start_date = current_week_start;
    -- Tính điểm cho mỗi cửa hàng và chèn vào bảng store_points
    FOR store_record IN 
        SELECT 
            s.store_id,
            s.total_sold_count,
            s.average_rating,
            s.rating_total,
            CASE WHEN s.create_at >= (CURRENT_DATE - INTERVAL '30 days') THEN TRUE ELSE FALSE END AS is_new_store
        FROM 
            stores s
        WHERE 
            s.status = 'active'
    LOOP
        INSERT INTO store_points (
            store_id,
            week_start_date,
            sales_points,
            new_store_points,
            rating_points
        ) VALUES (
            store_record.store_id,
            current_week_start,
            -- Điểm bán hàng (tối đa 200 điểm)
            ROUND((store_record.total_sold_count::NUMERIC / max_sales) * 200),
            -- Điểm cửa hàng mới (100 điểm nếu là cửa hàng mới)
            CASE WHEN store_record.is_new_store THEN 100 ELSE 0 END,
            -- Điểm đánh giá (tối đa 200 điểm)
            ROUND(((store_record.average_rating * store_record.rating_total) / max_rating) * 200)
        );
    END LOOP;
    -- Trả về tất cả kết quả đã tính toán cho tuần hiện tại
    RETURN QUERY
    SELECT 
        sp.store_id,
        sp.week_start_date,
        sp.sales_points,
        sp.new_store_points,
        sp.rating_points,
        sp.total_points
    FROM 
        store_points sp
    WHERE 
        sp.week_start_date = current_week_start;
END;
$$;
CREATE FUNCTION public.calculate_store_total_points(p_revenue_weight numeric DEFAULT 0.5, p_priority_weight numeric DEFAULT 0.2, p_rating_weight numeric DEFAULT 0.3) RETURNS TABLE(store_id uuid, store_name text, total_points integer, delta_revenue integer, delta_priority integer, delta_rating integer, accumulated_points integer, current_level integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH latest_points AS (
        SELECT DISTINCT ON (sp.store_id)
            sp.store_id,
            sp.delta_revenue,
            sp.delta_priority,
            sp.delta_rating,
            sp.accumulated_points,
            sp.current_level
        FROM 
            store_points sp
        ORDER BY 
            sp.store_id, sp.week_start_date DESC
    )
    SELECT 
        s.store_id,
        s.store_name,
        ROUND(
            COALESCE(lp.delta_revenue, 0) * p_revenue_weight + 
            COALESCE(lp.delta_priority, 0) * p_priority_weight + 
            COALESCE(lp.delta_rating, 0) * p_rating_weight
        )::INTEGER as total_points,
        COALESCE(lp.delta_revenue, 0) as delta_revenue,
        COALESCE(lp.delta_priority, 0) as delta_priority,
        COALESCE(lp.delta_rating, 0) as delta_rating,
        COALESCE(lp.accumulated_points, 0) as accumulated_points,
        COALESCE(lp.current_level, 0) as current_level
    FROM 
        stores s
    LEFT JOIN 
        latest_points lp ON s.store_id = lp.store_id
    WHERE 
        s.status = 'active'
    ORDER BY 
        total_points DESC;
END;
$$;
CREATE TABLE public.store_points (
    store_points_id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    week_start_date date NOT NULL,
    delta_revenue integer DEFAULT 0 NOT NULL,
    delta_priority integer DEFAULT 0 NOT NULL,
    delta_rating integer DEFAULT 0 NOT NULL,
    previous_accumulated_points integer DEFAULT 0 NOT NULL,
    accumulated_points integer DEFAULT 0 NOT NULL,
    current_level integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    delta_traffic integer DEFAULT 0
);
CREATE FUNCTION public.calculate_weekly_store_points(p_revenue_weight numeric DEFAULT 0.5, p_priority_weight numeric DEFAULT 0.2, p_rating_weight numeric DEFAULT 0.3) RETURNS SETOF public.store_points
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_week_start DATE;
    previous_week_start DATE;
    store_record RECORD;
    max_successful_orders INTEGER;
    -- Điểm tối đa
    max_revenue_points INTEGER := 200;
    priority_points_value INTEGER := 100;
    -- Điểm cần cho mỗi level
    points_per_level INTEGER := 100;
BEGIN
    --  Xác định ngày bắt đầu tuần hiện tại (Thứ Hai)
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE;
    previous_week_start := current_week_start - INTERVAL '7 days';
    -- Log kiểm tra
    RAISE NOTICE 'Current week start: %', current_week_start;
    RAISE NOTICE 'Previous week start: %', previous_week_start;
    -- Xóa toàn bộ dữ liệu của tuần trước
    DELETE FROM store_points WHERE week_start_date = previous_week_start;
    --  Xóa dữ liệu tuần hiện tại (nếu có)
    DELETE FROM store_points WHERE week_start_date = current_week_start;
    -- Tìm số đơn hàng thành công nhiều nhất trong tuần
    SELECT COALESCE(MAX(successful_orders), 0) INTO max_successful_orders 
    FROM (
        SELECT s.store_id, COUNT(o.order_id) AS successful_orders
        FROM stores s
        LEFT JOIN products p ON s.store_id = p.store_id
        LEFT JOIN orders o ON p.product_id = o.product_id AND o.order_status = 'successed'
        WHERE o.create_at >= current_week_start AND o.create_at < current_week_start + INTERVAL '7 days'
        GROUP BY s.store_id
    ) AS store_orders;
    -- Tránh lỗi chia cho 0
    IF max_successful_orders = 0 THEN
        max_successful_orders := 1;
    END IF;
    --  Tính điểm cho từng cửa hàng
    FOR store_record IN 
        SELECT 
            s.store_id,
            s.create_at,
            COUNT(o.order_id) AS successful_orders,
            COALESCE(AVG(sr.rating), 0) AS avg_rating,
            COALESCE(COUNT(sr.rating), 0) AS rating_count,
            -- Lấy accumulated_points từ tuần trước làm previous_accumulated_points
            COALESCE(
                (SELECT accumulated_points FROM store_points 
                 WHERE store_id = s.store_id AND week_start_date = previous_week_start),
                0
            ) AS previous_accumulated_points
        FROM 
            stores s
        LEFT JOIN 
            products p ON s.store_id = p.store_id
        LEFT JOIN 
            orders o ON p.product_id = o.product_id AND o.order_status = 'successed'
            AND o.create_at >= current_week_start AND o.create_at < current_week_start + INTERVAL '7 days'
        LEFT JOIN 
            store_ratings sr ON s.store_id = sr.store_id
            AND sr.create_at >= current_week_start AND sr.create_at < current_week_start + INTERVAL '7 days'
        WHERE 
            s.status = 'active'
        GROUP BY
            s.store_id, s.create_at
    LOOP
        -- Tính điểm từng tiêu chí
        DECLARE
            delta_revenue_value INTEGER;
            delta_priority_value INTEGER;
            delta_rating_value INTEGER;
            weighted_weekly_points INTEGER;
            new_accumulated_points INTEGER;
            new_level INTEGER;
        BEGIN
            -- Doanh thu: Max là 200 điểm
            delta_revenue_value := ROUND((store_record.successful_orders::NUMERIC / max_successful_orders) * max_revenue_points);
            --  Ưu tiên: 100 điểm nếu shop mới mở trong 2 tuần
            delta_priority_value := CASE 
                WHEN store_record.create_at >= (current_week_start - INTERVAL '14 days') THEN priority_points_value 
                ELSE 0 
            END;
            --  Rating: AVG * COUNT (giới hạn max 200 điểm)
            delta_rating_value := ROUND(store_record.avg_rating * store_record.rating_count * 10);
            delta_rating_value := LEAST(delta_rating_value, 200);
            -- Tổng điểm tuần này
            weighted_weekly_points := ROUND(
                delta_revenue_value * p_revenue_weight + 
                delta_priority_value * p_priority_weight + 
                delta_rating_value * p_rating_weight
            );
            -- 🔹 Cập nhật accumulated_points
            new_accumulated_points := store_record.previous_accumulated_points + weighted_weekly_points;
            -- Xác định level mới
            new_level := FLOOR(new_accumulated_points::NUMERIC / points_per_level);
            --  Chèn vào bảng store_points
            INSERT INTO store_points (
                store_id,
                week_start_date,
                delta_revenue,
                delta_priority,
                delta_rating,
                previous_accumulated_points,
                accumulated_points,
                current_level
            ) VALUES (
                store_record.store_id,
                current_week_start,
                delta_revenue_value,
                delta_priority_value,
                delta_rating_value,
                store_record.previous_accumulated_points,
                new_accumulated_points,
                new_level
            );
            -- Log kết quả từng cửa hàng
            RAISE NOTICE 'Store: %, Orders: %, Points (Rev: %, Pri: %, Rate: %), Weighted: %, Acc: %, Level: %', 
                store_record.store_id, 
                store_record.successful_orders, 
                delta_revenue_value, 
                delta_priority_value, 
                delta_rating_value,
                weighted_weekly_points,
                new_accumulated_points,
                new_level;
        END;
    END LOOP;
    -- Trả về dữ liệu tuần hiện tại
    RETURN QUERY
    SELECT * FROM store_points
    WHERE week_start_date = current_week_start
    ORDER BY accumulated_points DESC;
END;
$$;
CREATE FUNCTION public.calculate_weekly_store_points_new(p_week_start_date date DEFAULT NULL::date) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_week_start_date DATE;
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
BEGIN
    -- Xác định ngày bắt đầu tuần nếu không được cung cấp
    IF p_week_start_date IS NULL THEN
        v_week_start_date := date_trunc('week', CURRENT_DATE)::DATE;
    ELSE
        v_week_start_date := p_week_start_date;
    END IF;
    v_start_time := clock_timestamp();
    RAISE NOTICE 'Starting weekly store points calculation for week starting %', v_week_start_date;
    -- Bắt đầu transaction
    BEGIN
        -- BƯỚC QUAN TRỌNG: Đảm bảo mỗi store có một record cho tuần này
        PERFORM ensure_store_points_records(v_week_start_date);
        -- Tính Delta Revenue
        PERFORM calculate_delta_revenue(v_week_start_date);
        -- Tính Delta Priority
        PERFORM calculate_delta_priority(v_week_start_date);
        -- Tính Delta Rating
        PERFORM calculate_delta_rating(v_week_start_date);
        -- Tính Delta Traffic
        PERFORM calculate_delta_traffic(v_week_start_date);
        -- Cập nhật accumulated_points và level
        PERFORM update_accumulated_points_and_level(v_week_start_date);
        -- Commit transaction
        RAISE NOTICE 'Weekly store points calculation completed successfully';
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback nếu có lỗi
            RAISE EXCEPTION 'Error in weekly store points calculation: %', SQLERRM;
    END;
    v_end_time := clock_timestamp();
    RAISE NOTICE 'Weekly store points calculation completed in % seconds', 
                 EXTRACT(EPOCH FROM (v_end_time - v_start_time));
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
        -- Bước 1: Reset trạng thái - chỉ reset cho các store có duplicate_product = false
        UPDATE product_items pi
        SET 
            is_duplicate = false,
            checked_at = NULL
        FROM products p
        WHERE 
            pi.product_id = p.product_id
            AND pi.status = 'notsale'
            AND (p.store_id IS NULL OR EXISTS (
                SELECT 1 FROM stores s 
                WHERE s.store_id = p.store_id 
                AND (s.duplicate_product IS NULL OR s.duplicate_product = false)
            ));
        -- Bước 2: Tạo bảng tạm chỉ với các sản phẩm thuộc store KHÔNG cho phép trùng lặp
        CREATE TEMP TABLE temp_duplicates AS
        SELECT 
            pi.product_item_id,
            LOWER(TRIM(SPLIT_PART(pi.data_text, '|', 1))) AS identifier,
            ROW_NUMBER() OVER (
                PARTITION BY LOWER(TRIM(SPLIT_PART(pi.data_text, '|', 1))) 
                ORDER BY pi.create_at
            ) AS row_num
        FROM product_items pi
        JOIN products p ON pi.product_id = p.product_id
        LEFT JOIN stores s ON p.store_id = s.store_id
        WHERE 
            pi.status = 'notsale'
            AND (s.duplicate_product IS NULL OR s.duplicate_product = false);
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
        FROM product_items pi
        JOIN products p ON pi.product_id = p.product_id
        LEFT JOIN stores s ON p.store_id = s.store_id
        WHERE 
            pi.status = 'notsale'
            AND (s.duplicate_product IS NULL OR s.duplicate_product = false);
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
    update_at timestamp without time zone,
    comment text
);
CREATE FUNCTION public.donate_to_blog(p_donor_id uuid, p_blog_id character varying, p_donation_amount numeric, p_comment text DEFAULT NULL::text) RETURNS SETOF public.donations
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
        comment,
        create_at,
        update_at
    ) 
    VALUES (
        v_donation_id,
        p_blog_id,
        p_donor_id,
        p_donation_amount,
        NOW(),
        p_comment,
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
CREATE FUNCTION public.ensure_store_points_records(p_week_start_date date) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Tạo record cho các store chưa có record trong tuần này
    INSERT INTO store_points (
        store_id, 
        week_start_date, 
        delta_revenue, 
        delta_priority, 
        delta_rating, 
        delta_traffic,
        previous_accumulated_points,
        accumulated_points, 
        current_level, 
        created_at, 
        updated_at
    )
    SELECT 
        s.store_id, 
        p_week_start_date, 
        0, 0, 0, 0, 0, 0, 0, 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
    FROM 
        stores s
    WHERE 
        s.status = 'active'
        AND NOT EXISTS (
            SELECT 1 
            FROM store_points sp 
            WHERE sp.store_id = s.store_id 
              AND sp.week_start_date = p_week_start_date
        );
    RAISE NOTICE 'Ensured store_points records exist for all active stores for week %', p_week_start_date;
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
    description text,
    debug_info text
);
CREATE FUNCTION public.finalize_bid_aution(p_bid_id uuid) RETURNS SETOF public.bids_history
    LANGUAGE plpgsql
    AS $$
DECLARE
    winning_bid RECORD;
    bid_position_id uuid;
    bid_start_time timestamp;
    bid_duration_minutes numeric; -- Lấy từ configs, đơn vị là phút
    auction_end_time timestamp;
    result public.bids_history;
    position_category_id uuid; -- Lưu category_id của position
BEGIN
    -- Lấy position_id, bid_date và category_id từ bid và position hiện tại
    SELECT b.position_id, b.bid_date, p.category_id 
    INTO bid_position_id, bid_start_time, position_category_id
    FROM public.bids b
    JOIN public.positions p ON b.position_id = p.position_id
    WHERE b.bid_id = p_bid_id;
    IF bid_position_id IS NULL THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(), p_bid_id, NULL, NULL, 0,
            'auction_end', 'failed', NOW(),
            'Không tìm thấy bid với ID này'
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    -- Lấy bid_duration từ bảng configs với name = 'BID_DURATION'
    SELECT value::numeric INTO bid_duration_minutes
    FROM public.configs
    WHERE name = 'BID_DURATION'
    LIMIT 1;
    -- Kiểm tra bid_duration có hợp lệ không
    IF bid_duration_minutes IS NULL THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(), p_bid_id, NULL, bid_position_id, 0,
            'auction_end', 'failed', NOW(),
            'Không tìm thấy BID_DURATION trong configs'
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    -- Tính thời gian kết thúc đấu giá (bid_date + bid_duration_minutes phút)
    -- Ép kiểu bid_duration_minutes sang integer trước khi truyền vào make_interval
    auction_end_time := bid_start_time + make_interval(hours => bid_duration_minutes::integer);
    -- Kiểm tra xem thời gian hiện tại đã vượt qua thời gian kết thúc chưa
    IF NOW() < auction_end_time THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(), p_bid_id, NULL, bid_position_id, 0,
            'auction_end', 'failed', NOW(),
            format('Đấu giá chưa kết thúc. Thời gian kết thúc dự kiến: %s', auction_end_time)
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
    ORDER BY bh.bid_amount DESC
    LIMIT 1;
    -- Cập nhật trạng thái trong bảng bids trong mọi trường hợp
    UPDATE public.bids
    SET bid_status = 'completed',
        bid_amount = COALESCE(winning_bid.bid_amount, 0),
        update_at = NOW()
    WHERE bid_id = p_bid_id;
    -- Cập nhật positions với start_date và end_date
    UPDATE public.positions 
    SET 
        winner_stores = winning_bid.store_id, -- NULL nếu không có người thắng
        status = CASE WHEN winning_bid IS NULL THEN 'active' ELSE 'active' END,
        start_date = bid_start_time, -- Đặt start_date là bid_date
        end_date = CASE 
            WHEN position_category_id IS NULL THEN bid_start_time + INTERVAL '30 days'
            ELSE bid_start_time + INTERVAL '7 days'
        END, -- Đặt end_date dựa trên category_id
        update_at = NOW()
    WHERE position_id = bid_position_id;
    -- Trường hợp không có người tham gia đấu giá
    IF winning_bid IS NULL THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description
        ) VALUES (
            gen_random_uuid(), p_bid_id, NULL, bid_position_id, 0,
            'auction_end', 'completed', NOW(),
            format('Đấu giá %s kết thúc nhưng không có ai tham gia', p_bid_id)
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    -- Trường hợp có người thắng
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
    current_highest_bid RECORD;
    debug_text text := '';
BEGIN
    -- Bước 1: Kiểm tra p_bid_amount = 0
    debug_text := debug_text || 'Bước 1: Kiểm tra p_bid_amount = 0; ';
    IF p_bid_amount = 0 THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description, debug_info
        ) VALUES (
            gen_random_uuid(), p_bid_id, p_store_id, p_position_id, p_bid_amount,
            'error', 'failed', NOW(), 'Lỗi: Giá đặt bid phải lớn hơn 0', debug_text
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    debug_text := debug_text || 'Bước 1 hoàn tất: p_bid_amount = ' || p_bid_amount || '; ';
    -- Bước 2: Lấy thông tin store và user
    debug_text := debug_text || 'Bước 2: Lấy thông tin store cho store_id = ' || p_store_id || '; ';
    SELECT s.*, u.user_id, u.balance
    INTO store_info
    FROM public.stores s
    JOIN public.users u ON s.seller_id = u.user_id
    WHERE s.store_id = p_store_id
    AND s.status = 'active'
    FOR UPDATE OF u;
    -- Bước 3: Kiểm tra store tồn tại và active
    debug_text := debug_text || 'Bước 3: Kiểm tra store tồn tại và active; ';
    IF store_info IS NULL THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description, debug_info
        ) VALUES (
            gen_random_uuid(), p_bid_id, p_store_id, p_position_id, p_bid_amount,
            'error', 'failed', NOW(), 'Lỗi: Store không tồn tại hoặc không hoạt động', debug_text
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    debug_text := debug_text || 'Bước 3 hoàn tất: store tồn tại; ';
    -- Bước 4: Kiểm tra số dư ban đầu
    debug_text := debug_text || 'Bước 4: Kiểm tra số dư, cần ' || p_bid_amount || ' VND, hiện có ' || store_info.balance || ' VND; ';
    IF store_info.balance < p_bid_amount THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description, debug_info
        ) VALUES (
            gen_random_uuid(), p_bid_id, p_store_id, p_position_id, p_bid_amount,
            'error', 'failed', NOW(), 
            format('Lỗi: Số dư không đủ. Cần: %s VND, Hiện có: %s VND', p_bid_amount, store_info.balance),
            debug_text
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RETURN;
    END IF;
    debug_text := debug_text || 'Bước 4 hoàn tất: Số dư đủ; ';
    -- Bước 5: Lấy bid hiện tại (người thắng cuộc hiện tại)
    debug_text := debug_text || 'Bước 5: Lấy bid hiện tại cho position_id = ' || p_position_id || '; ';
    SELECT bh.*, u.user_id, u.balance, s.store_id
    INTO current_highest_bid
    FROM public.bids_history bh
    JOIN public.stores s ON bh.store_id = s.store_id
    JOIN public.users u ON s.seller_id = u.user_id
    WHERE bh.position_id = p_position_id
    AND bh.action = 'hold_bid'
    AND bh.status = 'hold'
    ORDER BY bh.bid_amount DESC
    LIMIT 1
    FOR UPDATE OF u;
    debug_text := debug_text || 'Bước 5 hoàn tất: current_highest_bid.bid_amount = ' || COALESCE(current_highest_bid.bid_amount::text, 'null') || '; ';
    -- Bước 6: Hoàn tiền cho người thắng cuộc trước (nếu có) và nếu bid mới cao hơn
    IF current_highest_bid IS NOT NULL THEN
        debug_text := debug_text || 'Bước 6: Kiểm tra hoàn tiền, bid mới = ' || p_bid_amount || ', bid cũ = ' || current_highest_bid.bid_amount || '; ';
        IF p_bid_amount > current_highest_bid.bid_amount THEN
            -- Hoàn tiền cho user của bid cũ (kể cả cùng store_id)
            UPDATE public.users
            SET balance = balance + current_highest_bid.bid_amount,
                update_at = NOW()
            WHERE user_id = current_highest_bid.user_id;
            debug_text := debug_text || 'Hoàn tiền cho user_id = ' || current_highest_bid.user_id || ', amount = ' || current_highest_bid.bid_amount || '; ';
            -- Ghi log hoàn tiền
            INSERT INTO public.bids_history (
                history_id, bid_id, store_id, position_id, bid_amount,
                action, status, create_at, description, debug_info
            ) VALUES (
                gen_random_uuid(), current_highest_bid.bid_id, current_highest_bid.store_id, p_position_id, current_highest_bid.bid_amount,
                'refund', 'completed', NOW(),
                format('Đã hoàn %s VND do có bid mới %s VND cao hơn từ store %s', 
                       current_highest_bid.bid_amount, p_bid_amount, p_store_id),
                debug_text
            ) RETURNING * INTO result;
            RETURN NEXT result;
            -- Cập nhật trạng thái bid cũ
            UPDATE public.bids_history
            SET status = 'refunded',
                update_at = NOW()
            WHERE history_id = current_highest_bid.history_id;
            debug_text := debug_text || 'Bước 6 hoàn tất: Đã hoàn tiền và cập nhật trạng thái bid cũ; ';
        ELSE
            -- Bid mới không cao hơn bid cũ, từ chối bid mới
            INSERT INTO public.bids_history (
                history_id, bid_id, store_id, position_id, bid_amount,
                action, status, create_at, description, debug_info
            ) VALUES (
                gen_random_uuid(), p_bid_id, p_store_id, p_position_id, p_bid_amount,
                'error', 'failed', NOW(),
                format('Lỗi: Bid mới %s VND không cao hơn bid hiện tại %s VND', p_bid_amount, current_highest_bid.bid_amount),
                debug_text
            ) RETURNING * INTO result;
            RETURN NEXT result;
            RETURN;
        END IF;
    ELSE
        debug_text := debug_text || 'Bước 6: Không có bid trước đó; ';
    END IF;
    -- Bước 7: Trừ tiền thẳng từ balance cho bid mới
    debug_text := debug_text || 'Bước 7: Trừ thẳng ' || p_bid_amount || ' VND từ balance; ';
    UPDATE public.users
    SET balance = balance - p_bid_amount,
        update_at = NOW()
    WHERE user_id = store_info.user_id;
    debug_text := debug_text || 'Bước 7 hoàn tất; ';
    -- Bước 8: Ghi log giữ tiền cho bid mới (người thắng cuộc mới)
    debug_text := debug_text || 'Bước 8: Ghi log bid mới; ';
    INSERT INTO public.bids_history (
        history_id, bid_id, store_id, position_id, bid_amount,
        action, status, create_at, description, debug_info
    ) VALUES (
        gen_random_uuid(), p_bid_id, p_store_id, p_position_id, p_bid_amount,
        'hold_bid', 'hold', NOW(),
        format('Đã trừ thẳng %s VND từ balance cho bid mới trên vị trí %s', p_bid_amount, p_position_id),
        debug_text
    ) RETURNING * INTO result;
    RETURN NEXT result;
    debug_text := debug_text || 'Bước 8 hoàn tất';
    RETURN;
EXCEPTION 
    WHEN OTHERS THEN
        INSERT INTO public.bids_history (
            history_id, bid_id, store_id, position_id, bid_amount,
            action, status, create_at, description, debug_info
        ) VALUES (
            gen_random_uuid(), p_bid_id, p_store_id, p_position_id, p_bid_amount,
            'error', 'failed', NOW(), 
            format('Lỗi khi xử lý đấu giá: %s', SQLERRM),
            debug_text || 'Lỗi tại bước nào đó'
        ) RETURNING * INTO result;
        RETURN NEXT result;
        RAISE EXCEPTION 'Rollback do lỗi: %', SQLERRM;
END;
$$;
CREATE FUNCTION public.increment_store_access() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Chỉ tăng access_count khi thực sự insert record mới
    IF TG_OP = 'INSERT' THEN
        UPDATE stores 
        SET access_count = access_count + 1 
        WHERE store_id = NEW.store_id;
    END IF;
    RETURN NEW;
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
    order_type character varying,
    complete_date_service timestamp without time zone,
    is_pre_order boolean DEFAULT false
);
CREATE FUNCTION public.process_delayed_payment() RETURNS SETOF public.orders
    LANGUAGE plpgsql
    AS $$
DECLARE
    order_record RECORD;
    processed_order_ids uuid[] := ARRAY[]::uuid[];
    system_user_id uuid := '4aa9e580-331a-49c5-a352-de34e8d25585'::uuid; -- ID của hệ thống
    reseller_id uuid; -- ID của reseller
    reseller_amount numeric; -- Số tiền chia cho reseller
    seller_amount numeric; -- Số tiền cho seller
    commission_rate numeric; -- Tỷ lệ hoa hồng từ reseller_store_links
BEGIN
    -- Lấy các orders có order_type = 'product', đủ 3 ngày (hoặc 10 ngày cho complained) và chưa được xử lý
    FOR order_record IN 
        SELECT o.*, 
               COALESCE(latest_log.logs_by, system_user_id) as last_updated_by,
               latest_log.status_after as last_status
        FROM public.orders o
        LEFT JOIN LATERAL (
            SELECT logs_by, status_after
            FROM public.orders_logs
            WHERE order_id = o.order_id
            ORDER BY change_date DESC
            LIMIT 1
        ) latest_log ON true
        WHERE o.order_type = 'product' -- Chỉ xử lý order_type = 'product'
        AND (
            (o.order_status IN ('pending', 'completed', 'cancel') 
             AND o.create_at + INTERVAL '3 days' <= CURRENT_TIMESTAMP)
            OR 
            (o.order_status = 'complained' 
             AND o.create_at + INTERVAL '10 days' <= CURRENT_TIMESTAMP)
        )
    LOOP
        BEGIN
            -- Khởi tạo giá trị mặc định
            reseller_id := NULL;
            reseller_amount := 0;
            seller_amount := order_record.total_amount;
            commission_rate := 0;
            -- Lấy thông tin reseller từ reseller_store_links nếu có referral_code
            IF order_record.referral_code IS NOT NULL THEN
                BEGIN
                    SELECT rsl.user_id, rsl.commission_rate
                    INTO reseller_id, commission_rate
                    FROM public.reseller_store_links rsl
                    WHERE rsl.referral_code = order_record.referral_code
                    AND rsl.store_id = (
                        SELECT store_id 
                        FROM public.products 
                        WHERE product_id = order_record.product_id
                    )
                    LIMIT 1;
                    IF reseller_id IS NOT NULL AND commission_rate > 0 THEN
                        reseller_amount := order_record.total_amount * commission_rate;
                        seller_amount := order_record.total_amount - reseller_amount;
                    END IF;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE 'Error fetching reseller info for order %: %', 
                            order_record.order_id, SQLERRM;
                END;
            END IF;
            CASE order_record.order_status
                WHEN 'pending' THEN
                    -- Chuyển tiền cho seller
                    BEGIN
                        UPDATE public.users
                        SET balance = balance + seller_amount,
                            update_at = CURRENT_TIMESTAMP
                        WHERE user_id = (
                            SELECT s.seller_id 
                            FROM public.products p
                            JOIN public.stores s ON p.store_id = s.store_id
                            WHERE p.product_id = order_record.product_id
                        );
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error updating seller balance for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Chuyển tiền cho reseller (nếu có)
                    IF reseller_id IS NOT NULL THEN
                        BEGIN
                            UPDATE public.users
                            SET balance = balance + reseller_amount,
                                update_at = CURRENT_TIMESTAMP
                            WHERE user_id = reseller_id;
                        EXCEPTION
                            WHEN OTHERS THEN
                                RAISE NOTICE 'Error updating reseller balance for order %: %', 
                                    order_record.order_id, SQLERRM;
                        END;
                    END IF;
                    -- Cập nhật trạng thái order thành successed
                    BEGIN
                        UPDATE public.orders
                        SET order_status = 'successed',
                            update_at = CURRENT_TIMESTAMP
                        WHERE order_id = order_record.order_id;
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error updating order status to successed for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Ghi log
                    BEGIN
                        INSERT INTO public.orders_logs (
                            logs_by,
                            status_before,
                            status_after,
                            order_id,
                            change_date,
                            create_at,
                            update_at,
                            note
                        )
                        VALUES (
                            system_user_id,
                            'pending',
                            'successed',
                            order_record.order_id,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP,
                            CASE WHEN reseller_id IS NOT NULL 
                                 THEN format('Chia %s VND cho reseller %s (commission_rate: %s)', 
                                            reseller_amount, reseller_id, commission_rate)
                                 ELSE NULL END
                        );
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error logging for order % (pending -> successed): %', 
                                order_record.order_id, SQLERRM;
                    END;
                WHEN 'completed' THEN
                    -- Chuyển tiền cho seller
                    BEGIN
                        UPDATE public.users
                        SET balance = balance + seller_amount,
                            update_at = CURRENT_TIMESTAMP
                        WHERE user_id = (
                            SELECT s.seller_id 
                            FROM public.products p
                            JOIN public.stores s ON p.store_id = s.store_id
                            WHERE p.product_id = order_record.product_id
                        );
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error updating seller balance for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Chuyển tiền cho reseller (nếu có)
                    IF reseller_id IS NOT NULL THEN
                        BEGIN
                            UPDATE public.users
                            SET balance = balance + reseller_amount,
                                update_at = CURRENT_TIMESTAMP
                            WHERE user_id = reseller_id;
                        EXCEPTION
                            WHEN OTHERS THEN
                                RAISE NOTICE 'Error updating reseller balance for order %: %', 
                                    order_record.order_id, SQLERRM;
                        END;
                    END IF;
                    -- Cập nhật trạng thái order thành successed
                    BEGIN
                        UPDATE public.orders
                        SET order_status = 'successed',
                            update_at = CURRENT_TIMESTAMP
                        WHERE order_id = order_record.order_id;
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error updating order status to successed for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Ghi log
                    BEGIN
                        INSERT INTO public.orders_logs (
                            logs_by,
                            status_before,
                            status_after,
                            order_id,
                            change_date,
                            create_at,
                            update_at,
                            note
                        )
                        VALUES (
                            order_record.last_updated_by,
                            'completed',
                            'successed',
                            order_record.order_id,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP,
                            CASE WHEN reseller_id IS NOT NULL 
                                 THEN format('Chia %s VND cho reseller %s (commission_rate: %s)', 
                                            reseller_amount, reseller_id, commission_rate)
                                 ELSE NULL END
                        );
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error logging for order % (completed -> successed): %', 
                                order_record.order_id, SQLERRM;
                    END;
                WHEN 'cancel' THEN
                    -- Hoàn tiền cho khách hàng
                    BEGIN
                        UPDATE public.users
                        SET balance = balance + order_record.total_amount,
                            update_at = CURRENT_TIMESTAMP
                        WHERE user_id = order_record.buyer_id;
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error refunding buyer for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Hoàn số lượng vào kho
                    BEGIN
                        UPDATE public.products
                        SET stock_count = stock_count + order_record.quantity,
                            sold_count = sold_count - order_record.quantity,
                            update_at = CURRENT_TIMESTAMP
                        WHERE product_id = order_record.product_id;
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error updating product stock for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Cập nhật trạng thái product_items
                    BEGIN
                        WITH cte AS (
                            SELECT pi.product_item_id
                            FROM public.product_items pi
                            WHERE pi.product_id = order_record.product_id
                            AND pi.sale_at = order_record.create_at
                            LIMIT order_record.quantity
                        )
                        UPDATE public.product_items
                        SET 
                            status = 'notsale',
                            sale_at = NULL,
                            update_at = CURRENT_TIMESTAMP
                        WHERE product_item_id IN (SELECT product_item_id FROM cte);
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error updating product_items for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Cập nhật trạng thái order
                    BEGIN
                        UPDATE public.orders
                        SET order_status = 'refunded',
                            update_at = CURRENT_TIMESTAMP
                        WHERE order_id = order_record.order_id;
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error updating order status to refunded for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Ghi log
                    BEGIN
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
                            order_record.last_updated_by,
                            'cancel',
                            'refunded',
                            order_record.order_id,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        );
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error logging for order % (cancel -> refunded): %', 
                                order_record.order_id, SQLERRM;
                    END;
                WHEN 'complained' THEN
                    -- Chuyển tiền cho seller
                    BEGIN
                        UPDATE public.users
                        SET balance = balance + seller_amount,
                            update_at = CURRENT_TIMESTAMP
                        WHERE user_id = (
                            SELECT s.seller_id 
                            FROM public.products p
                            JOIN public.stores s ON p.store_id = s.store_id
                            WHERE p.product_id = order_record.product_id
                        );
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error updating seller balance for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Chuyển tiền cho reseller (nếu có)
                    IF reseller_id IS NOT NULL THEN
                        BEGIN
                            UPDATE public.users
                            SET balance = balance + reseller_amount,
                                update_at = CURRENT_TIMESTAMP
                            WHERE user_id = reseller_id;
                        EXCEPTION
                            WHEN OTHERS THEN
                                RAISE NOTICE 'Error updating reseller balance for order %: %', 
                                    order_record.order_id, SQLERRM;
                        END;
                    END IF;
                    -- Cập nhật trạng thái order thành completed
                    BEGIN
                        UPDATE public.orders
                        SET order_status = 'completed',
                            update_at = CURRENT_TIMESTAMP
                        WHERE order_id = order_record.order_id;
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error updating order status to completed for order %: %', 
                                order_record.order_id, SQLERRM;
                    END;
                    -- Ghi log
                    BEGIN
                        INSERT INTO public.orders_logs (
                            logs_by,
                            status_before,
                            status_after,
                            order_id,
                            change_date,
                            create_at,
                            update_at,
                            note
                        )
                        VALUES (
                            system_user_id,
                            'complained',
                            'completed',
                            order_record.order_id,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP,
                            CASE WHEN reseller_id IS NOT NULL 
                                 THEN format('Chia %s VND cho reseller %s (commission_rate: %s)', 
                                            reseller_amount, reseller_id, commission_rate)
                                 ELSE NULL END
                        );
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Error logging for order % (complained -> completed): %', 
                                order_record.order_id, SQLERRM;
                    END;
            END CASE;
            -- Thêm order_id vào array các order đã xử lý
            processed_order_ids := array_append(processed_order_ids, order_record.order_id);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Unexpected error in main loop for order %: %', 
                    order_record.order_id, SQLERRM;
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
    position_end_date timestamptz;
BEGIN
    -- Lấy các position cần xử lý
    FOR pos IN 
        SELECT 
            p.position_id,
            p.winner_stores,
            p.position_name,
            p.start_date,
            p.end_date,
            p.category_id,
            p.bid_amount
        FROM public.positions p
        WHERE (p.start_date IS NULL 
            OR p.end_date IS NULL
            OR p.end_date <= NOW() + INTERVAL '2 days')  -- Lấy position đã hết hạn hoặc sắp hết hạn trong 2 ngày
    LOOP
        -- Tính end_date mới mà không reset position
        position_end_date := CASE 
            WHEN pos.category_id IS NULL THEN NOW() + INTERVAL '30 days' -- Hết hạn sau 30 ngày nếu không có category
            ELSE NOW() + INTERVAL '7 days' -- Hết hạn sau 7 ngày nếu có category
        END;
        -- Cập nhật trạng thái các bid cũ
        UPDATE public.bids
        SET 
            bid_status = 'completed', -- Đặt trạng thái bid là đã hoàn thành
            update_at = NOW() -- Cập nhật thời gian sửa đổi
        WHERE position_id = pos.position_id
        AND bid_status = 'active';
        -- Tạo bid khởi điểm mới
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
            gen_random_uuid(), -- Tạo ID ngẫu nhiên cho bid
            pos.position_id,
            NULL, -- Không có store_id
            COALESCE(pos.bid_amount, 1000), -- Sử dụng bid_amount của position hoặc 1000 nếu NULL
            'active', -- Trạng thái bid là hoạt động
            GREATEST(NOW(), COALESCE(pos.end_date, NOW()) - INTERVAL '2 days'), -- Đảm bảo bid_date không trong quá khứ
            NOW(), -- Thời gian tạo
            NOW()  -- Thời gian cập nhật
        );
    END LOOP;
END;
$$;
CREATE FUNCTION public.schedule_auction_reset() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id UUID;
  v_end_date TIMESTAMP;
  v_job_name TEXT;
  v_chain_id BIGINT;
BEGIN
  FOR v_id, v_end_date IN
    SELECT position_id, end_date 
    FROM public.positions
  LOOP
    v_job_name := 'reset_auction_job_' || v_id;
    IF v_end_date < NOW() THEN
      PERFORM public.reset_and_create_new_auction();
      RAISE NOTICE 'Processed expired auction % with end_date %', v_id, v_end_date;
    ELSIF v_end_date > NOW() THEN
      DELETE FROM timetable.chain WHERE chain_name = v_job_name;
      INSERT INTO timetable.chain (chain_name, run_at)
      VALUES (v_job_name, v_end_date::TEXT)
      RETURNING chain_id INTO v_chain_id;
      INSERT INTO timetable.task (chain_id, task_name, kind, command)
      VALUES (v_chain_id, v_job_name || '_task', 'SQL', 'SELECT public.reset_and_create_new_auction();');
      RAISE NOTICE 'Scheduled job % to run at %', v_job_name, v_end_date;
    END IF;
  END LOOP;
  IF NOT FOUND THEN
    RAISE NOTICE 'No end_date found in positions table';
  END IF;
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
CREATE FUNCTION public.schedule_weekly_store_points() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM calculate_store_points_internal();
END;
$$;
CREATE FUNCTION public.submit_order_product(buyer_id uuid, seller_id uuid, product_id uuid, quantity integer, coupon_value numeric DEFAULT NULL::numeric, is_pre_order boolean DEFAULT false) RETURNS SETOF public.orders
    LANGUAGE plpgsql
    AS $$
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
    initial_status varchar := CASE WHEN is_pre_order THEN 'waiting' ELSE 'pending' END;
    temp_log_id uuid;  -- Đổi tên biến từ log_id thành temp_log_id
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
    -- Kiểm tra user không được mua hàng từ store của chính họ
    IF EXISTS (SELECT 1 FROM public.stores WHERE public.stores.seller_id = buyer_id AND public.stores.seller_id = submit_order_product.seller_id) THEN
        RAISE EXCEPTION 'Không thể mua hàng từ chính store của bạn';
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
    -- Kiểm tra tồn kho (bỏ qua nếu là pre-order)
    IF NOT is_pre_order AND available_stock < submit_order_product.quantity THEN
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
    -- Log bước kiểm tra ban đầu
    INSERT INTO public.orders_logs (
        logs_by,
        status_before,
        status_after,
        order_id,
        change_date,
        create_at,
        update_at,
        notes
    )
    VALUES (
        submit_order_product.buyer_id,
        NULL,
        'initiating',
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        format('Bắt đầu tạo đơn hàng: buyer_id=%s, product_id=%s, quantity=%s', buyer_id, product_id, quantity)
    )
    RETURNING log_id INTO temp_log_id;  -- Sử dụng temp_log_id thay vì log_id
    -- Trừ tiền từ tài khoản người mua
    UPDATE public.users
    SET 
        balance = balance - final_amount,
        update_at = CURRENT_TIMESTAMP
    WHERE user_id = submit_order_product.buyer_id;
    -- Log việc trừ tiền
    INSERT INTO public.orders_logs (
        logs_by,
        status_before,
        status_after,
        order_id,
        change_date,
        create_at,
        update_at,
        notes
    )
    VALUES (
        submit_order_product.buyer_id,
        'initiating',
        'balance_updated',
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        format('Đã trừ %s từ số dư của buyer_id=%s', final_amount, buyer_id)
    )
    RETURNING log_id INTO temp_log_id;  -- Sử dụng temp_log_id thay vì log_id
    -- Tạo order code ngẫu nhiên 6 ký tự (base-36)
    LOOP
        new_order_code := substring(
            to_base36(floor(random() * 2176782336)::bigint), 
            1, 
            6
        );
        new_order_code := LPAD(new_order_code, 6, '0');
        EXIT WHEN NOT EXISTS (
            SELECT 1 
            FROM public.orders 
            WHERE order_code = new_order_code
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
        is_pre_order
    )
    VALUES (
        gen_random_uuid(),
        submit_order_product.buyer_id,
        CURRENT_TIMESTAMP,
        final_amount,
        initial_status,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        submit_order_product.product_id,
        submit_order_product.quantity,
        product_price,
        'product',
        new_order_code,
        is_pre_order
    )
    RETURNING order_id INTO new_order_id;
    -- Log việc tạo đơn hàng
    INSERT INTO public.orders_logs (
        logs_by,
        status_before,
        status_after,
        order_id,
        change_date,
        create_at,
        update_at,
        notes
    )
    VALUES (
        submit_order_product.buyer_id,
        'balance_updated',
        initial_status,
        new_order_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        format('Đơn hàng %s đã được tạo với order_code=%s', new_order_id, new_order_code)
    )
    RETURNING log_id INTO temp_log_id;  -- Sử dụng temp_log_id thay vì log_id
    -- Cập nhật tồn kho và số lượng đã bán (bỏ qua nếu là pre-order)
    IF NOT is_pre_order THEN
        UPDATE public.products
        SET 
            stock_count = stock_count - submit_order_product.quantity,
            sold_count = sold_count + submit_order_product.quantity,
            update_at = CURRENT_TIMESTAMP
        WHERE public.products.product_id = submit_order_product.product_id;
        -- Log cập nhật tồn kho
        INSERT INTO public.orders_logs (
            logs_by,
            status_before,
            status_after,
            order_id,
            change_date,
            create_at,
            update_at,
            notes
        )
        VALUES (
            submit_order_product.buyer_id,
            initial_status,
            initial_status,
            new_order_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            format('Cập nhật kho: giảm %s đơn vị cho product_id=%s', quantity, product_id)
        )
        RETURNING log_id INTO temp_log_id;  -- Sử dụng temp_log_id thay vì log_id
        -- Cập nhật các bản ghi trong bảng `product_items`
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
        -- Log cập nhật product_items
        INSERT INTO public.orders_logs (
            logs_by,
            status_before,
            status_after,
            order_id,
            change_date,
            create_at,
            update_at,
            notes
        )
        VALUES (
            submit_order_product.buyer_id,
            initial_status,
            initial_status,
            new_order_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            format('Cập nhật %s product_items từ notsale sang sale', quantity)
        )
        RETURNING log_id INTO temp_log_id;  -- Sử dụng temp_log_id thay vì log_id
    END IF;
    -- Trả về đơn hàng vừa tạo
    RETURN QUERY 
    SELECT * FROM public.orders WHERE order_id = new_order_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Ghi log lỗi và hủy giao dịch
        INSERT INTO public.orders_logs (
            logs_by,
            status_before,
            status_after,
            order_id,
            change_date,
            create_at,
            update_at,
            notes
        )
        VALUES (
            submit_order_product.buyer_id,
            initial_status,
            'failed',
            new_order_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            format('Lỗi: %s', SQLERRM)
        )
        RETURNING log_id INTO temp_log_id;  -- Sử dụng temp_log_id thay vì log_id
        RAISE EXCEPTION 'Giao dịch thất bại: %', SQLERRM;
END;
$$;
CREATE FUNCTION public.submit_order_services(buyer_id uuid, seller_id uuid, product_id uuid, coupon_value numeric DEFAULT NULL::numeric, complete_date_service timestamp without time zone DEFAULT NULL::timestamp without time zone) RETURNS SETOF public.orders
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_amount numeric(10,2);
    product_price numeric(10,2);
    buyer_balance numeric(10,2);
    new_order_id uuid;
    store_seller_id uuid;
    final_amount numeric(10,2);
    store_id uuid;
    new_order_code char(6);
    temp_log_id uuid;  -- Đổi tên từ log_id để tránh ambiguous
BEGIN
    -- Kiểm tra tính hợp lệ của buyer_id, seller_id, product_id
    IF buyer_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = buyer_id) THEN
        RAISE EXCEPTION 'buyer_id không hợp lệ hoặc không tồn tại';
    END IF;
    IF seller_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.stores WHERE public.stores.seller_id = submit_order_services.seller_id) THEN
        RAISE EXCEPTION 'seller_id không hợp lệ hoặc không tồn tại';
    END IF;
    IF product_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.products WHERE public.products.product_id = submit_order_services.product_id) THEN
        RAISE EXCEPTION 'product_id không hợp lệ hoặc không tồn tại';
    END IF;
    -- Kiểm tra user không được mua dịch vụ từ store của chính họ
    IF EXISTS (SELECT 1 FROM public.stores WHERE public.stores.seller_id = buyer_id AND public.stores.seller_id = submit_order_services.seller_id) THEN
        RAISE EXCEPTION 'Không thể mua dịch vụ từ chính store của bạn';
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
    WHERE p.product_id = submit_order_services.product_id
    AND p.is_service = true;
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
    IF store_seller_id IS DISTINCT FROM submit_order_services.seller_id THEN
        RAISE EXCEPTION 'Người bán không hợp lệ cho service này';
    END IF;
    -- Tính tổng số tiền
    total_amount := product_price;
    -- Áp dụng mã giảm giá nếu có
    IF coupon_value IS NOT NULL AND coupon_value > 0 THEN
        final_amount := total_amount * (1 - coupon_value / 100);
    ELSE
        final_amount := total_amount;
    END IF;
    -- Kiểm tra số dư người mua
    SELECT balance INTO buyer_balance
    FROM public.users u
    WHERE u.user_id = submit_order_services.buyer_id;
    IF buyer_balance < final_amount THEN
        RAISE EXCEPTION 'Số dư không đủ. Cần: %, Có sẵn: %',
            final_amount, buyer_balance;
    END IF;
    -- Log bước kiểm tra ban đầu
    INSERT INTO public.orders_logs (
        logs_by,
        status_before,
        status_after,
        order_id,
        change_date,
        create_at,
        update_at,
        notes
    )
    VALUES (
        submit_order_services.buyer_id,
        NULL,
        'initiating',
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        format('Bắt đầu tạo đơn dịch vụ: buyer_id=%s, product_id=%s, complete_date=%s', buyer_id, product_id, complete_date_service)
    )
    RETURNING log_id INTO temp_log_id;
    -- Trừ tiền từ tài khoản người mua
    UPDATE public.users
    SET 
        balance = balance - final_amount,
        update_at = CURRENT_TIMESTAMP
    WHERE user_id = submit_order_services.buyer_id;
    -- Log việc trừ tiền
    INSERT INTO public.orders_logs (
        logs_by,
        status_before,
        status_after,
        order_id,
        change_date,
        create_at,
        update_at,
        notes
    )
    VALUES (
        submit_order_services.buyer_id,
        'initiating',
        'balance_updated',
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        format('Đã trừ %s từ số dư của buyer_id=%s', final_amount, buyer_id)
    )
    RETURNING log_id INTO temp_log_id;
    -- Tạo order code ngẫu nhiên 6 ký tự (base-36)
    LOOP
        new_order_code := substring(
            to_base36(floor(random() * 2176782336)::bigint), 
            1, 
            6
        );
        new_order_code := LPAD(new_order_code, 6, '0');
        EXIT WHEN NOT EXISTS (
            SELECT 1 
            FROM public.orders 
            WHERE order_code = new_order_code
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
        complete_date_service
    )
    VALUES (
        gen_random_uuid(),
        submit_order_services.buyer_id,
        CURRENT_TIMESTAMP,
        final_amount,
        'pending',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        submit_order_services.product_id,
        1,
        product_price,
        'service',
        new_order_code,
        complete_date_service
    )
    RETURNING order_id INTO new_order_id;
    -- Log việc tạo đơn hàng
    INSERT INTO public.orders_logs (
        logs_by,
        status_before,
        status_after,
        order_id,
        change_date,
        create_at,
        update_at,
        notes
    )
    VALUES (
        submit_order_services.buyer_id,
        'balance_updated',
        'pending',
        new_order_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        format('Đơn dịch vụ %s đã được tạo với order_code=%s, hoàn thành vào %s', new_order_id, new_order_code, complete_date_service)
    )
    RETURNING log_id INTO temp_log_id;
    -- Trả về đơn hàng vừa tạo
    RETURN QUERY 
    SELECT * FROM public.orders WHERE order_id = new_order_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Ghi log lỗi và hủy giao dịch
        INSERT INTO public.orders_logs (
            logs_by,
            status_before,
            status_after,
            order_id,
            change_date,
            create_at,
            update_at,
            notes
        )
        VALUES (
            submit_order_services.buyer_id,
            'pending',
            'failed',
            new_order_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            format('Lỗi: %s', SQLERRM)
        )
        RETURNING log_id INTO temp_log_id;
        RAISE EXCEPTION 'Giao dịch thất bại: %', SQLERRM;
END;
$$;
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
CREATE FUNCTION public.test_log() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE NOTICE 'Test log';
END;
$$;
CREATE FUNCTION public.to_base36(num bigint) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    chars char[] := ARRAY['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    result text := '';
    n bigint := num;
BEGIN
    IF n < 0 THEN
        RAISE EXCEPTION 'Số âm không được hỗ trợ';
    END IF;
    WHILE n > 0 LOOP
        result := chars[(n % 36) + 1] || result;
        n := n / 36;
    END LOOP;
    RETURN COALESCE(result, '0');
END;
$$;
CREATE FUNCTION public.update_accumulated_points_and_level(p_week_start_date date) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Cập nhật các store có điểm tích lũy từ trước
    UPDATE store_points sp
    SET 
        previous_accumulated_points = COALESCE(prev_points.accumulated_points, 0),
        accumulated_points = COALESCE(prev_points.accumulated_points, 0) + 
                             ROUND(sp.delta_revenue * 0.4) +   -- 40% trọng số
                             ROUND(sp.delta_priority * 0.1) +  -- 10% trọng số
                             ROUND(sp.delta_rating * 0.3) +    -- 30% trọng số
                             ROUND(sp.delta_traffic * 0.2),    -- 20% trọng số
        current_level = FLOOR((COALESCE(prev_points.accumulated_points, 0) + 
                              ROUND(sp.delta_revenue * 0.4) +
                              ROUND(sp.delta_priority * 0.1) +
                              ROUND(sp.delta_rating * 0.3) +
                              ROUND(sp.delta_traffic * 0.2)) / 100),
        updated_at = CURRENT_TIMESTAMP
    FROM (
        -- Subquery để lấy điểm tích lũy trước đó
        SELECT 
            sp1.store_id,
            sp1.accumulated_points
        FROM 
            store_points sp1
        WHERE 
            sp1.week_start_date = (
                SELECT MAX(week_start_date) 
                FROM store_points sp2 
                WHERE sp2.store_id = sp1.store_id AND sp2.week_start_date < p_week_start_date
            )
    ) AS prev_points
    WHERE 
        sp.store_id = prev_points.store_id AND
        sp.week_start_date = p_week_start_date;
    -- Xử lý các store không có điểm tích lũy trước đó
    UPDATE store_points sp
    SET 
        previous_accumulated_points = 0,
        accumulated_points = ROUND(sp.delta_revenue * 0.4) +
                             ROUND(sp.delta_priority * 0.1) +
                             ROUND(sp.delta_rating * 0.3) +
                             ROUND(sp.delta_traffic * 0.2),
        current_level = FLOOR((ROUND(sp.delta_revenue * 0.4) +
                              ROUND(sp.delta_priority * 0.1) +
                              ROUND(sp.delta_rating * 0.3) +
                              ROUND(sp.delta_traffic * 0.2)) / 100),
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        sp.week_start_date = p_week_start_date AND
        NOT EXISTS (
            SELECT 1 
            FROM store_points prev
            WHERE prev.store_id = sp.store_id AND prev.week_start_date < p_week_start_date
        );
    -- Log thành công
    RAISE NOTICE 'Accumulated points and level updated successfully for week starting %', p_week_start_date;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating accumulated points and level: %', SQLERRM;
END;
$$;
CREATE FUNCTION public.update_blog_favorite_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blogs
    SET favorite_count = COALESCE(favorite_count, 0) + 1
    WHERE blog_id = NEW.blog_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blogs
    SET favorite_count = GREATEST(COALESCE(favorite_count, 0) - 1, 0)
    WHERE blog_id = OLD.blog_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
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
    RAISE NOTICE 'Processing INSERT - Store ID: %, Stock: %, Sold: %, API Private Stock: %, API Private Sold: %', 
                 NEW.store_id, NEW.stock_count, NEW.sold_count, NEW.api_private_stock, NEW.api_private_sold;
    UPDATE stores
    SET 
      total_stock_count = COALESCE(total_stock_count, 0) + COALESCE(NEW.stock_count, 0) + COALESCE(NEW.api_private_stock, 0),
      total_sold_count = COALESCE(total_sold_count, 0) + COALESCE(NEW.sold_count, 0) + COALESCE(NEW.api_private_sold, 0)
    WHERE store_id = NEW.store_id;
  -- Nếu là UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    RAISE NOTICE 'Processing UPDATE - Store ID: %', NEW.store_id;
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
    -- Cập nhật api_private_stock nếu có thay đổi
    IF COALESCE(NEW.api_private_stock, 0) != COALESCE(OLD.api_private_stock, 0) THEN
      RAISE NOTICE 'Updating API private stock for store: %', NEW.store_id;
      UPDATE stores
      SET total_stock_count = COALESCE(total_stock_count, 0) + (COALESCE(NEW.api_private_stock, 0) - COALESCE(OLD.api_private_stock, 0))
      WHERE store_id = NEW.store_id;
    END IF;
    -- Cập nhật api_private_sold nếu có thay đổi
    IF COALESCE(NEW.api_private_sold, 0) != COALESCE(OLD.api_private_sold, 0) THEN
      RAISE NOTICE 'Updating API private sold for store: %', NEW.store_id;
      UPDATE stores
      SET total_sold_count = COALESCE(total_sold_count, 0) + (COALESCE(NEW.api_private_sold, 0) - COALESCE(OLD.api_private_sold, 0))
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
CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
CREATE FUNCTION public.update_user_telegram_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update telegram_connection_status in users table
  UPDATE public.users
  SET telegram_connection_status = true
  WHERE referral_code = NEW.referral_code;
  RETURN NULL;  -- AFTER triggers must return NULL
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
    bid_id uuid DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE public.blog_favourite (
    favourite_id uuid DEFAULT gen_random_uuid() NOT NULL,
    blog_id character varying(36) NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
    is_deleted timestamp with time zone,
    total_view integer DEFAULT 0,
    favorite_count integer DEFAULT 0
);
CREATE TABLE public.users (
    user_id uuid NOT NULL,
    username character varying NOT NULL,
    password character varying NOT NULL,
    images character varying,
    email character varying NOT NULL,
    last_login timestamp with time zone,
    balance numeric(10,2) DEFAULT 0,
    create_at timestamp without time zone DEFAULT now(),
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
    slug text,
    telegram_connection_status boolean DEFAULT false
);
CREATE VIEW public.blogs_comment_view AS
 SELECT c.comment_id,
    c.message_content,
    c.sent_date,
    c.blog_id,
    c.user_id,
    u.username,
    u.images,
    c.is_deleted,
    c.create_at,
    c.update_at,
    c.parent_id,
    c.is_liked
   FROM (public.blog_comments c
     LEFT JOIN public.users u ON ((c.user_id = u.user_id)));
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
    use_private_warehouse boolean DEFAULT false,
    api_private_stock integer DEFAULT 0,
    api_private_sold integer DEFAULT 0,
    last_time_sync date
);
CREATE TABLE public.stores (
    store_id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid,
    store_name character varying,
    description text,
    average_rating double precision,
    create_at timestamp without time zone DEFAULT now(),
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
    short_description character varying(255),
    access_count integer DEFAULT 0,
    allow_pre_order boolean DEFAULT false,
    deleted boolean DEFAULT false
);
CREATE VIEW public.complain_view AS
 SELECT c.complain_id,
    c.content,
    c.created_at,
    c.image,
    c.status,
    o.order_id,
    o.order_code,
    o.quantity,
    o.total_amount,
    u.user_id,
    u.username,
    p.product_id,
    s.store_id,
    s.store_name,
    store_owner.user_id AS owner_id,
    store_owner.username AS owner_username
   FROM (((((public.complain_order c
     JOIN public.orders o ON ((c.order_id = o.order_id)))
     JOIN public.users u ON ((o.buyer_id = u.user_id)))
     JOIN public.products p ON ((o.product_id = p.product_id)))
     JOIN public.stores s ON ((p.store_id = s.store_id)))
     JOIN public.users store_owner ON ((s.seller_id = store_owner.user_id)));
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
CREATE VIEW public.donation_comments_view AS
 SELECT d.donation_id,
    d.blog_id,
    d.user_id,
    d.amount,
    d.donation_date,
    d.comment,
    u.username,
    u.images,
    b.title AS blog_title,
    d.create_at,
    d.update_at
   FROM ((public.donations d
     LEFT JOIN public.users u ON ((d.user_id = u.user_id)))
     LEFT JOIN public.blogs b ON (((d.blog_id)::text = (b.blog_id)::text)))
  WHERE (d.comment IS NOT NULL);
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
CREATE VIEW public.get_seller_store_view AS
 SELECT u.user_id,
    u.username,
    u.images,
    u.full_name,
    u.seller_since,
    u.last_login,
    s.store_id,
    COALESCE(sum(s.total_sold_count), (0)::bigint) AS total_sold_count,
    COALESCE(sum(s.total_stock_count), (0)::bigint) AS total_stock_count,
    c1.slug AS category_slug,
    c1.category_name,
    c2.slug AS parent_category_slug,
    c2.category_name AS parent_category_name
   FROM (((public.users u
     LEFT JOIN public.stores s ON ((u.user_id = s.seller_id)))
     LEFT JOIN public.categories c1 ON ((s.category_id = c1.category_id)))
     LEFT JOIN public.categories c2 ON ((c1.parent_category_id = c2.category_id)))
  GROUP BY u.user_id, u.username, u.images, u.full_name, u.seller_since, u.last_login, s.store_id, c1.slug, c1.category_name, c2.slug, c2.category_name;
CREATE VIEW public.listing_bid_histories AS
 SELECT bh.action,
    bh.bid_amount,
    bh.bid_date,
    bh.bid_id,
    bh.history_id,
    bh.create_at,
    bh.position_id,
    bh.status,
    bh.store_id,
    bh.update_at,
    s.store_name,
    s.avatar,
    u.user_id,
    u.username,
    u.full_name,
    u.email,
    u.balance,
    u.images
   FROM ((public.bids_history bh
     JOIN public.stores s ON ((bh.store_id = s.store_id)))
     JOIN public.users u ON ((s.seller_id = u.user_id)));
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
    o.complete_date_service,
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
        CASE
            WHEN ((s.total_stock_count = 0) AND (s.allow_pre_order = false)) THEN 'inactive'::public.store_status
            ELSE s.status
        END AS status,
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
          WHERE ((p.store_id = s.store_id) AND ((p.status)::text = 'active'::text))) AS highest_price,
    ( SELECT min(p.price) AS min
           FROM public.products p
          WHERE ((p.store_id = s.store_id) AND ((p.status)::text = 'active'::text))) AS lowest_price,
    ( SELECT count(*) AS count
           FROM public.products p
          WHERE (p.store_id = s.store_id)) AS product_count,
    ( SELECT array_agg(w.wishlist_id) AS array_agg
           FROM public.wishlist w
          WHERE (w.store_id = s.store_id)) AS wishlist_ids,
    s.store_tag,
    s.allow_pre_order
   FROM (((public.stores s
     LEFT JOIN public.users u ON ((s.seller_id = u.user_id)))
     LEFT JOIN public.categories c ON ((s.category_id = c.category_id)))
     LEFT JOIN public.categories c_parent ON ((c.parent_category_id = c_parent.category_id)));
CREATE VIEW public.monthly_revenue AS
 SELECT date_trunc('month'::text, create_at) AS month,
    sum(total_amount) AS total_amount
   FROM public.orders
  GROUP BY (date_trunc('month'::text, create_at))
  ORDER BY (date_trunc('month'::text, create_at));
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
CREATE VIEW public.orders_by_month AS
 SELECT EXTRACT(month FROM order_date) AS month_number,
    to_char(order_date, 'Month'::text) AS month_name,
    count(*) AS successed_count
   FROM public.orders
  WHERE ((order_status)::text = 'successed'::text)
  GROUP BY (EXTRACT(month FROM order_date)), (to_char(order_date, 'Month'::text))
  ORDER BY (EXTRACT(month FROM order_date));
CREATE TABLE public.orders_logs (
    log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    logs_by uuid NOT NULL,
    status_before text,
    status_after text,
    change_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    order_id uuid,
    create_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    update_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    notes text
);
CREATE VIEW public.orders_per_day AS
 SELECT date(create_at) AS order_date,
    count(*) AS total_orders
   FROM public.orders
  GROUP BY (date(create_at))
  ORDER BY (date(create_at));
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
    position_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    position_name character varying,
    description text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    status character varying,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    winner_stores uuid,
    category_id uuid,
    bid_amount numeric
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
CREATE VIEW public.related_stores AS
 SELECT s.store_id AS "storeId",
    s.store_name AS "storeName",
    s.sub_title AS "subTitle",
    s.description,
    s.short_description AS "shortDescription",
    s.avatar,
    s.store_price AS "storePrice",
    s.duplicate_product AS "duplicateProduct",
    s.private_warehouse AS "privateWarehouse",
    s.total_sold_count AS "totalSoldCount",
    s.total_stock_count AS "totalStockCount",
    s.slug,
    s.store_tag AS "storeTag",
    s.seller_id AS "sellerId",
    c.category_id AS "categoryId",
    c.category_name AS "categoryName",
    COALESCE(u.username, 'Unknown Seller'::character varying) AS "sellerName",
    u.images AS "sellerAvatar",
        CASE
            WHEN (s.duplicate_product = true) THEN 'Duplicate'::text
            ELSE 'Not Duplicate'::text
        END AS "duplicateStatus",
    COALESCE(s.total_sold_count, 0) AS sold,
    COALESCE(s.total_stock_count, 0) AS "stockCount",
    COALESCE(s.store_price, (0)::numeric) AS price,
    true AS "isService",
        CASE
            WHEN (s.slug IS NOT NULL) THEN (s.slug)::text
            ELSE concat('service-', s.store_id)
        END AS "serviceSlug"
   FROM ((public.stores s
     LEFT JOIN public.users u ON ((s.seller_id = u.user_id)))
     LEFT JOIN public.categories c ON ((s.category_id = c.category_id)));
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
    u.user_id,
    s.store_name,
    s.slug AS store_slug,
    concat('/products/', s.slug, '?ref=', u.referral_code) AS share_link,
    u.balance AS user_balance
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
CREATE TABLE public.store_access_logs (
    store_access_logs_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    store_id uuid NOT NULL,
    access_date date NOT NULL,
    session_id text
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
    image character varying,
    order_codes character varying,
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
    s.allow_pre_order,
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
CREATE VIEW public.stores_view AS
 SELECT s.store_id,
    s.store_name,
    s.seller_id,
    u.username AS seller_name,
    u.last_login,
    u.email,
    s.short_description,
    s.sub_title,
    s.store_price,
    s.store_tag,
    s.average_rating,
    s.total_sold_count,
    s.total_stock_count,
    s.status,
    s.avatar,
    s.deleted,
    s.create_at,
    s.update_at,
    s.category_id,
    c.category_name,
    ( SELECT COALESCE(sum(o.total_amount), (0)::numeric) AS "coalesce"
           FROM (public.orders o
             JOIN public.products p ON ((o.product_id = p.product_id)))
          WHERE (p.store_id = s.store_id)) AS total_revenue,
    ( SELECT count(*) AS count
           FROM (public.orders o
             JOIN public.products p ON ((o.product_id = p.product_id)))
          WHERE (p.store_id = s.store_id)) AS total_orders,
    ( SELECT count(*) AS count
           FROM public.coupons c2
          WHERE ((c2.store_id = s.store_id) AND (c2.deleted = false))) AS active_coupons,
    ( SELECT count(*) AS count
           FROM public.products p
          WHERE (p.store_id = s.store_id)) AS total_products,
    ( SELECT COALESCE(sum(p.stock_count), (0)::numeric) AS "coalesce"
           FROM public.products p
          WHERE (p.store_id = s.store_id)) AS total_product_quantity
   FROM ((public.stores s
     LEFT JOIN public.users u ON ((s.seller_id = u.user_id)))
     LEFT JOIN public.categories c ON ((s.category_id = c.category_id)));
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
CREATE TABLE public.telegram_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    telegram_id text NOT NULL,
    referral_code text NOT NULL,
    telegram_username text,
    telegram_first_name text,
    telegram_last_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
CREATE VIEW public.user_statistics AS
 SELECT user_id,
    seller_since,
    ( SELECT count(*) AS count
           FROM public.orders o
          WHERE (o.buyer_id = u.user_id)) AS total_orders,
    ( SELECT count(*) AS count
           FROM public.stores s
          WHERE (s.seller_id = u.user_id)) AS total_stores,
    ( SELECT COALESCE(sum(s.total_sold_count), (0)::bigint) AS "coalesce"
           FROM public.stores s
          WHERE (s.seller_id = u.user_id)) AS total_sold,
    ( SELECT count(*) AS count
           FROM public.blogs b
          WHERE (b.user_id = u.user_id)) AS total_blogs
   FROM public.users u;
CREATE VIEW public.winner_stores AS
 SELECT p.position_id,
    p.position_name,
    p.winner_stores,
    p.category_id,
    ls.store_id,
    ls.store_name,
    ls.avatar,
    ls.slug,
    ls.sub_title,
    ls.store_price,
    ls.average_rating,
    ls.rating_total,
    ls.sold AS total_sold_count,
    ls.stock AS total_stock_count,
    ls.seller_id,
    ls.seller_name,
    ls.seller_avatar,
    ls.category_name,
    ls.category_slug,
    ls.category_type,
    ls.parent_category_name,
    ls.parent_category_slug,
    ls.highest_price,
    ls.lowest_price,
    ls.product_count,
    ls.store_tag,
    ls.wishlist_ids
   FROM (public.positions p
     LEFT JOIN public.listing_stores ls ON ((ls.store_id = p.winner_stores)))
  ORDER BY p.position_name;
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
ALTER TABLE ONLY public.blog_favourite
    ADD CONSTRAINT blog_favourite_blog_id_user_id_key UNIQUE (blog_id, user_id);
ALTER TABLE ONLY public.blog_favourite
    ADD CONSTRAINT blog_favourite_pkey PRIMARY KEY (favourite_id);
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
ALTER TABLE ONLY public.store_access_logs
    ADD CONSTRAINT store_access_logs_pkey PRIMARY KEY (store_access_logs_id);
ALTER TABLE ONLY public.store_access_logs
    ADD CONSTRAINT store_access_logs_unique_daily_visit UNIQUE (store_id, access_date, user_id, session_id);
ALTER TABLE ONLY public.store_points
    ADD CONSTRAINT store_points_pkey PRIMARY KEY (store_points_id);
ALTER TABLE ONLY public.store_points
    ADD CONSTRAINT store_points_store_id_week_start_date_key UNIQUE (store_id, week_start_date);
ALTER TABLE ONLY public.store_points
    ADD CONSTRAINT store_points_store_id_week_start_date_unique UNIQUE (store_id, week_start_date);
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
ALTER TABLE ONLY public.telegram_connections
    ADD CONSTRAINT telegram_referrals_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.telegram_connections
    ADD CONSTRAINT telegram_referrals_telegram_id_key UNIQUE (telegram_id);
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
CREATE INDEX blog_favourite_blog_id_idx ON public.blog_favourite USING btree (blog_id);
CREATE INDEX blog_favourite_user_id_idx ON public.blog_favourite USING btree (user_id);
CREATE INDEX idx_deposit_logs_deposit_id ON public.deposit_logs USING btree (deposit_id);
CREATE INDEX idx_deposit_logs_status ON public.deposit_logs USING btree (status);
CREATE INDEX idx_ghost_id ON public.blogs USING btree (ghost_id);
CREATE INDEX idx_orders_product_id ON public.orders USING btree (product_id);
CREATE INDEX idx_product_items_checked_at ON public.product_items USING btree (checked_at);
CREATE INDEX idx_product_items_identifier ON public.product_items USING btree (lower(TRIM(BOTH FROM split_part(data_text, '|'::text, 1))));
CREATE INDEX idx_product_items_is_duplicate ON public.product_items USING btree (is_duplicate);
CREATE INDEX idx_product_items_status ON public.product_items USING btree (status);
CREATE INDEX idx_products_store_id ON public.products USING btree (store_id);
CREATE INDEX idx_store_points_accumulated_points ON public.store_points USING btree (accumulated_points);
CREATE INDEX idx_store_points_current_level ON public.store_points USING btree (current_level);
CREATE INDEX idx_store_points_store_id ON public.store_points USING btree (store_id);
CREATE INDEX idx_store_points_week_start_date ON public.store_points USING btree (week_start_date);
CREATE INDEX idx_store_ratings_store_id ON public.store_ratings USING btree (store_id);
CREATE INDEX idx_wishlist_store_id ON public.wishlist USING btree (store_id);
CREATE TRIGGER blog_favorite_count_trigger AFTER INSERT OR DELETE ON public.blog_favourite FOR EACH ROW EXECUTE FUNCTION public.update_blog_favorite_count();
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
CREATE TRIGGER store_access_trigger AFTER INSERT ON public.store_access_logs FOR EACH ROW EXECUTE FUNCTION public.increment_store_access();
CREATE TRIGGER trigger_update_reseller_commission AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_reseller_commission();
CREATE TRIGGER update_store_points_updated_at BEFORE UPDATE ON public.store_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_registration_timestamp BEFORE UPDATE ON public.store_registrations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_store_stock_and_sold_count_trigger AFTER INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_store_stock_and_sold_count();
CREATE TRIGGER update_store_stock_on_product_delete_trigger BEFORE DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_store_stock_on_product_delete();
CREATE TRIGGER update_store_stock_on_product_item_delete_trigger BEFORE DELETE ON public.product_items FOR EACH ROW EXECUTE FUNCTION public.update_store_stock_on_product_item_delete();
CREATE TRIGGER update_user_telegram_status_trigger AFTER INSERT ON public.telegram_connections FOR EACH ROW EXECUTE FUNCTION public.update_user_telegram_status();
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
ALTER TABLE ONLY public.blog_favourite
    ADD CONSTRAINT blog_favourite_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(blog_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_favourite
    ADD CONSTRAINT blog_favourite_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
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
    ADD CONSTRAINT positions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
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
ALTER TABLE ONLY public.store_access_logs
    ADD CONSTRAINT store_access_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.store_access_logs
    ADD CONSTRAINT store_access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.store_points
    ADD CONSTRAINT store_points_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);
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
ALTER TABLE ONLY public.telegram_connections
    ADD CONSTRAINT telegram_conections_referral_code_fkey FOREIGN KEY (referral_code) REFERENCES public.users(referral_code) ON UPDATE RESTRICT ON DELETE RESTRICT;
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
