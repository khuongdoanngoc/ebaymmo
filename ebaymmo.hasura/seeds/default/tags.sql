-- Insert seed data into tags table
INSERT INTO public.tags (tag_id, tag_name, slug, create_at, update_at)
VALUES
    (gen_random_uuid(), 'Email', 'email', now(), now()),
    (gen_random_uuid(), 'Software', 'software', now(), now()),
    (gen_random_uuid(), 'Account', 'account', now(), now()),
    (gen_random_uuid(), 'Other Products', 'other-products', now(), now()),
    (gen_random_uuid(), 'Increase Engagement', 'increase-engagement', now(), now()),
    (gen_random_uuid(), 'Software Services', 'software-services', now(), now()),
    (gen_random_uuid(), 'Blockchain', 'blockchain', now(), now()),
    (gen_random_uuid(), 'Other Services', 'other-services', now(), now());

-- Insert seed data into tags table for email subcategories
INSERT INTO public.tags (tag_id, tag_name, slug, create_at, update_at)
VALUES
    (gen_random_uuid(), 'Gmail', 'gmail', now(), now()),
    (gen_random_uuid(), 'HotMail', 'hotmail', now(), now()),
    (gen_random_uuid(), 'OutlookMail', 'outlookmail', now(), now()),
    (gen_random_uuid(), 'RuMail', 'rumail', now(), now()),
    (gen_random_uuid(), 'DomainMail', 'domainmail', now(), now()),
    (gen_random_uuid(), 'YahooMail', 'yahoomail', now(), now()),
    (gen_random_uuid(), 'ProtonMail', 'protonmail', now(), now()),
    (gen_random_uuid(), 'Other Mail Types', 'other-mail-types', now(), now());

-- Insert seed data into tags table for account subcategories
INSERT INTO public.tags (tag_id, tag_name, slug, create_at, update_at)
VALUES
    (gen_random_uuid(), 'FB Account', 'fb-account', now(), now()),
    (gen_random_uuid(), 'BM Account', 'bm-account', now(), now()),
    (gen_random_uuid(), 'Zalo Account', 'zalo-account', now(), now()),
    (gen_random_uuid(), 'Twitter Account', 'twitter-account', now(), now()),
    (gen_random_uuid(), 'Telegram Account', 'telegram-account', now(), now()),
    (gen_random_uuid(), 'Instagram Account', 'instagram-account', now(), now()),
    (gen_random_uuid(), 'Shopee Account', 'shopee-account', now(), now()),
    (gen_random_uuid(), 'Discord Account', 'discord-account', now(), now()),
    (gen_random_uuid(), 'TikTok Account', 'tiktok-account', now(), now()),
    (gen_random_uuid(), 'Antivirus Key', 'antivirus-key', now(), now()),
    (gen_random_uuid(), 'Windows Key', 'windows-key', now(), now()),
    (gen_random_uuid(), 'Other Accounts', 'other-accounts', now(), now());

-- Insert seed data into tags table for software subcategories
INSERT INTO public.tags (tag_id, tag_name, slug, create_at, update_at)
VALUES
    (gen_random_uuid(), 'FB Software', 'fb-software', now(), now()),
    (gen_random_uuid(), 'Google Software', 'google-software', now(), now()),
    (gen_random_uuid(), 'YouTube Software', 'youtube-software', now(), now()),
    (gen_random_uuid(), 'Crypto Software', 'crypto-software', now(), now()),
    (gen_random_uuid(), 'PTC Software', 'ptc-software', now(), now()),
    (gen_random_uuid(), 'Captcha Software', 'captcha-software', now(), now()),
    (gen_random_uuid(), 'Offer Software', 'offer-software', now(), now()),
    (gen_random_uuid(), 'PTU Software', 'ptu-software', now(), now()),
    (gen_random_uuid(), 'Other Software', 'other-software', now(), now());

-- Insert seed data into tags table for other products subcategories
INSERT INTO public.tags (tag_id, tag_name, slug, create_at, update_at)
VALUES
    (gen_random_uuid(), 'Top-up Card', 'top-up-card', now(), now()),
    (gen_random_uuid(), 'VPS', 'vps', now(), now()),
    (gen_random_uuid(), 'Others', 'others', now(), now());

-- Insert seed data into tags table for increase engagement subcategories
INSERT INTO public.tags (tag_id, tag_name, slug, create_at, update_at)
VALUES
    (gen_random_uuid(), 'Facebook Services', 'facebook-services', now(), now()),
    (gen_random_uuid(), 'Tiktok Services', 'tiktok-services', now(), now()),
    (gen_random_uuid(), 'Google Services', 'google-services', now(), now()),
    (gen_random_uuid(), 'Telegram Services', 'telegram-services', now(), now()),
    (gen_random_uuid(), 'Shopee Services', 'shopee-services', now(), now()),
    (gen_random_uuid(), 'Discord Services', 'discord-services', now(), now()),
    (gen_random_uuid(), 'Twitter Services', 'twitter-services', now(), now()),
    (gen_random_uuid(), 'Youtube Services', 'youtube-services', now(), now()),
    (gen_random_uuid(), 'Zalo Services', 'zalo-services', now(), now()),
    (gen_random_uuid(), 'Instagram Services', 'instagram-services', now(), now()),
    (gen_random_uuid(), 'Other Interactions', 'other-interactions', now(), now());

-- Insert seed data into tags table for blockchain subcategories
INSERT INTO public.tags (tag_id, tag_name, slug, create_at, update_at)
VALUES
    (gen_random_uuid(), 'Cryptocurrency Services', 'cryptocurrency-services', now(), now()),
    (gen_random_uuid(), 'NFT Services', 'nft-services', now(), now()),
    (gen_random_uuid(), 'Coinlist Services', 'coinlist-services', now(), now()),
    (gen_random_uuid(), 'Other Blockchain', 'other-blockchain', now(), now());

-- Insert seed data into tags table for software services subcategories
INSERT INTO public.tags (tag_id, tag_name, slug, create_at, update_at)
VALUES
    (gen_random_uuid(), 'Tool Coding Services', 'tool-coding-services', now(), now()),
    (gen_random_uuid(), 'Graphic Services', 'graphic-services', now(), now()),
    (gen_random_uuid(), 'Video Services', 'video-services', now(), now()),
    (gen_random_uuid(), 'Other Tool Services', 'other-tool-services', now(), now());