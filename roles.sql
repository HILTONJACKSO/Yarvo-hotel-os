INSERT INTO roles (id, name, description, permissions, "updatedAt") VALUES 
(gen_random_uuid(), 'ADMIN', 'Administrator', '{}', NOW()),
(gen_random_uuid(), 'CEO', 'Chief Executive Officer', '{}', NOW()),
(gen_random_uuid(), 'TICKETING_STAFF', 'Staff who issues tickets for pool and gate', '{}', NOW())
ON CONFLICT (name) DO NOTHING;
