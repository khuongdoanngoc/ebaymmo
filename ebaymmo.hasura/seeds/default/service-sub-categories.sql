-- Insert seed data into categories table for increase engagement subcategories
INSERT INTO public.categories (category_id, category_name, type, parent_category_id, create_at, update_at, slug)
VALUES
    (gen_random_uuid(), 'Facebook Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'facebook-services'),
    (gen_random_uuid(), 'Tiktok Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'tiktok-services'),
    (gen_random_uuid(), 'Google Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'google-services'),
    (gen_random_uuid(), 'Telegram Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'telegram-services'),
    (gen_random_uuid(), 'Shopee Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'shopee-services'),
    (gen_random_uuid(), 'Discord Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'discord-services'),
    (gen_random_uuid(), 'Twitter Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'twitter-services'),
    (gen_random_uuid(), 'Youtube Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'youtube-services'),
    (gen_random_uuid(), 'Zalo Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'zalo-services'),
    (gen_random_uuid(), 'Instagram Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'instagram-services'),
    (gen_random_uuid(), 'Other Interactions', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Increase Engagement'), now(), now(), 'other-interactions');

    -- Insert seed data into categories table for blockchain subcategories
INSERT INTO public.categories (category_id, category_name, type, parent_category_id, create_at, update_at, slug)
VALUES
    (gen_random_uuid(), 'Cryptocurrency Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Blockchain'), now(), now(), 'cryptocurrency-services'),
    (gen_random_uuid(), 'NFT Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Blockchain'), now(), now(), 'nft-services'),
    (gen_random_uuid(), 'Coinlist Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Blockchain'), now(), now(), 'coinlist-services'),
    (gen_random_uuid(), 'Other Blockchain', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Blockchain'), now(), now(), 'other-blockchain');


    -- Insert seed data into categories table for software services subcategories
INSERT INTO public.categories (category_id, category_name, type, parent_category_id, create_at, update_at, slug)
VALUES
    (gen_random_uuid(), 'Tool Coding Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Software Services'), now(), now(), 'tool-coding-services'),
    (gen_random_uuid(), 'Graphic Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Software Services'), now(), now(), 'graphic-services'),
    (gen_random_uuid(), 'Video Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Software Services'), now(), now(), 'video-services'),
    (gen_random_uuid(), 'Other Tool Services', 'Service', (SELECT category_id FROM public.categories WHERE category_name = 'Software Services'), now(), now(), 'other-tool-services');