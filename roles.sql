INSERT INTO roles (id, name, description, permissions, "updatedAt") VALUES 
(gen_random_uuid(), 'CASHIER', 'Handles payments and POS transactions', '{}', NOW()),
(gen_random_uuid(), 'KITCHEN_CHEF', 'Kitchen and food preparation staff', '{}', NOW()),
(gen_random_uuid(), 'STAFF_WAITER', 'Restaurant and bar service staff', '{}', NOW()),
(gen_random_uuid(), 'SUPERVISOR', 'Shift supervisor with elevated permissions', '{}', NOW())
ON CONFLICT (name) DO NOTHING;
