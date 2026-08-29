-- Bella Casa HMS - PostgreSQL 18 Database Initialization
-- This script runs when the Docker container is first created.
-- Creates the test database alongside the main database.

-- Create test database if it doesn't exist
SELECT 'CREATE DATABASE bellacasa_test OWNER bellacasa'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bellacasa_test')
\gexec
