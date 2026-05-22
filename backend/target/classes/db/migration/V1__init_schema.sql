-- V1__init_schema.sql

CREATE EXTENSION
IF
  NOT EXISTS "pgcrypto";

  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    , email VARCHAR(255) NOT NULL UNIQUE
    , password_hash VARCHAR(255) NOT NULL
    , full_name VARCHAR(255) NOT NULL
    , currency VARCHAR(10) NOT NULL DEFAULT 'USD'
    , created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    , updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    , user_id UUID NOT NULL REFERENCES users(id)
    ON DELETE CASCADE
    , name VARCHAR(255) NOT NULL
    , type VARCHAR(50) NOT NULL CHECK (
      type IN ('checking', 'savings', 'credit', 'investment')
    )
    , balance DECIMAL(19, 4) NOT NULL DEFAULT 0
    , currency VARCHAR(10) NOT NULL DEFAULT 'USD'
    , is_active BOOLEAN NOT NULL DEFAULT TRUE
    , created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    , updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    , account_id UUID NOT NULL REFERENCES accounts(id)
    ON DELETE CASCADE
    , type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer'))
    , amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0)
    , currency VARCHAR(10) NOT NULL DEFAULT 'USD'
    , category VARCHAR(100)
    , description TEXT
    , transaction_date DATE NOT NULL
    , status VARCHAR(20) NOT NULL DEFAULT 'cleared' CHECK (status IN ('pending', 'cleared', 'reconciled'))
    , transfer_to_account_id UUID REFERENCES accounts(id)
    , created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    , updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  -- Indexes for common query patterns
  CREATE INDEX idx_accounts_user_id
  ON accounts(user_id);
  CREATE INDEX idx_transactions_account
  ON transactions(account_id);
  CREATE INDEX idx_transactions_date
  ON transactions(transaction_date DESC);
  CREATE INDEX idx_transactions_category
  ON transactions(category);