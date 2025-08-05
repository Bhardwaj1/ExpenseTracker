-- Create database
CREATE DATABASE finance_tracker;

-- Connect to the database
\c finance_tracker;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'read-only')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table (for future use)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, type, color) VALUES
('Food & Dining', 'expense', '#ef4444'),
('Transportation', 'expense', '#f97316'),
('Shopping', 'expense', '#eab308'),
('Entertainment', 'expense', '#22c55e'),
('Bills & Utilities', 'expense', '#3b82f6'),
('Healthcare', 'expense', '#8b5cf6'),
('Education', 'expense', '#06b6d4'),
('Travel', 'expense', '#f59e0b'),
('Income', 'income', '#10b981'),
('Other', 'both', '#6b7280');

-- Insert demo users (passwords are hashed versions of the demo passwords)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'admin'),
('Regular User', 'user@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'user'),
('Read Only User', 'readonly@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'read-only');

-- Insert sample transactions for demo users
INSERT INTO transactions (user_id, type, amount, description, category, date) VALUES
-- Admin user transactions
((SELECT id FROM users WHERE email = 'admin@demo.com'), 'income', 5000.00, 'Monthly Salary', 'Income', '2024-01-01'),
((SELECT id FROM users WHERE email = 'admin@demo.com'), 'expense', 1200.00, 'Rent Payment', 'Bills & Utilities', '2024-01-01'),
((SELECT id FROM users WHERE email = 'admin@demo.com'), 'expense', 300.00, 'Groceries', 'Food & Dining', '2024-01-02'),
((SELECT id FROM users WHERE email = 'admin@demo.com'), 'expense', 50.00, 'Gas', 'Transportation', '2024-01-03'),
((SELECT id FROM users WHERE email = 'admin@demo.com'), 'expense', 100.00, 'Movie Night', 'Entertainment', '2024-01-05'),

-- Regular user transactions
((SELECT id FROM users WHERE email = 'user@demo.com'), 'income', 3500.00, 'Freelance Work', 'Income', '2024-01-01'),
((SELECT id FROM users WHERE email = 'user@demo.com'), 'expense', 800.00, 'Rent', 'Bills & Utilities', '2024-01-01'),
((SELECT id FROM users WHERE email = 'user@demo.com'), 'expense', 200.00, 'Groceries', 'Food & Dining', '2024-01-02'),
((SELECT id FROM users WHERE email = 'user@demo.com'), 'expense', 75.00, 'Internet Bill', 'Bills & Utilities', '2024-01-03'),

-- Read-only user transactions
((SELECT id FROM users WHERE email = 'readonly@demo.com'), 'income', 2500.00, 'Part-time Job', 'Income', '2024-01-01'),
((SELECT id FROM users WHERE email = 'readonly@demo.com'), 'expense', 600.00, 'Rent', 'Bills & Utilities', '2024-01-01'),
((SELECT id FROM users WHERE email = 'readonly@demo.com'), 'expense', 150.00, 'Groceries', 'Food & Dining', '2024-01-02');
