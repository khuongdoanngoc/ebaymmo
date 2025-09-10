-- Insert seed data into categories table for email subcategories
INSERT INTO public.categories (category_id, category_name, type, parent_category_id, create_at, update_at, slug)
VALUES
    (gen_random_uuid(), 'Gmail', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Email'), now(), now(), 'gmail'),
    (gen_random_uuid(), 'HotMail', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Email'), now(), now(), 'hotmail'),
    (gen_random_uuid(), 'OutlookMail', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Email'), now(), now(), 'outlookmail'),
    (gen_random_uuid(), 'RuMail', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Email'), now(), now(), 'rumail'),
    (gen_random_uuid(), 'DomainMail', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Email'), now(), now(), 'domainmail'),
    (gen_random_uuid(), 'YahooMail', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Email'), now(), now(), 'yahoomail'),
    (gen_random_uuid(), 'ProtonMail', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Email'), now(), now(), 'protonmail'),
    (gen_random_uuid(), 'Other Mail Types', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Email'), now(), now(), 'other-mail-types');


    -- Insert seed data into categories table for account subcategories
INSERT INTO public.categories (category_id, category_name, type, parent_category_id, create_at, update_at, slug)
VALUES
    (gen_random_uuid(), 'FB Account', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'fb-account'),
    (gen_random_uuid(), 'BM Account', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'bm-account'),
    (gen_random_uuid(), 'Zalo Account', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'zalo-account'),
    (gen_random_uuid(), 'Twitter Account', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'twitter-account'),
    (gen_random_uuid(), 'Telegram Account', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'telegram-account'),
    (gen_random_uuid(), 'Instagram Account', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'instagram-account'),
    (gen_random_uuid(), 'Shopee Account', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'shopee-account'),
    (gen_random_uuid(), 'Discord Account', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'discord-account'),
    (gen_random_uuid(), 'TikTok Account', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'tiktok-account'),
    (gen_random_uuid(), 'Antivirus Key', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'antivirus-key'),
    (gen_random_uuid(), 'Windows Key', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'windows-key'),
    (gen_random_uuid(), 'Other Accounts', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Account'), now(), now(), 'other-accounts');

    -- Insert seed data into categories table for software subcategories
INSERT INTO public.categories (category_id, category_name, type, parent_category_id, create_at, update_at, slug)
VALUES
    (gen_random_uuid(), 'FB Software', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Software'), now(), now(), 'fb-software'),
    (gen_random_uuid(), 'Google Software', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Software'), now(), now(), 'google-software'),
    (gen_random_uuid(), 'YouTube Software', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Software'), now(), now(), 'youtube-software'),
    (gen_random_uuid(), 'Crypto Software', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Software'), now(), now(), 'crypto-software'),
    (gen_random_uuid(), 'PTC Software', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Software'), now(), now(), 'ptc-software'),
    (gen_random_uuid(), 'Captcha Software', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Software'), now(), now(), 'captcha-software'),
    (gen_random_uuid(), 'Offer Software', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Software'), now(), now(), 'offer-software'),
    (gen_random_uuid(), 'PTU Software', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Software'), now(), now(), 'ptu-software'),
    (gen_random_uuid(), 'Other Software', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Software'), now(), now(), 'other-software');

    -- Insert seed data into categories table for other products subcategories
INSERT INTO public.categories (category_id, category_name, type, parent_category_id, create_at, update_at, slug)
VALUES
    (gen_random_uuid(), 'Top-up Card', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Other Products'), now(), now(), 'top-up-card'),
    (gen_random_uuid(), 'VPS', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Other Products'), now(), now(), 'vps'),
    (gen_random_uuid(), 'Others', 'Product', (SELECT category_id FROM public.categories WHERE category_name = 'Other Products'), now(), now(), 'others');