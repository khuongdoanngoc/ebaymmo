-- Insert seed data into categories table
INSERT INTO public.categories (category_id, category_name, type, parent_category_id, create_at, update_at, slug)
VALUES
    (gen_random_uuid(), 'Email', 'Product', NULL, now(), now(), 'email'),
    (gen_random_uuid(), 'Software', 'Product', NULL, now(), now(), 'software'),
    (gen_random_uuid(), 'Account', 'Product', NULL, now(), now(), 'account'),
    (gen_random_uuid(), 'Other Products', 'Product', NULL, now(), now(), 'other-products'),
    (gen_random_uuid(), 'Increase Engagement', 'Service', NULL, now(), now(), 'increase-engagement'),
    (gen_random_uuid(), 'Software Services', 'Service', NULL, now(), now(), 'software-services'),
    (gen_random_uuid(), 'Blockchain', 'Service', NULL, now(), now(), 'blockchain'),
    (gen_random_uuid(), 'Other Services', 'Service', NULL, now(), now(), 'other-services');