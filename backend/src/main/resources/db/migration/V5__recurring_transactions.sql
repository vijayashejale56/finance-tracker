CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , user_id UUID NOT NULL REFERENCES users(id)
  ON DELETE CASCADE
  , account_id UUID NOT NULL REFERENCES accounts(id)
  ON DELETE CASCADE
  , type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense'))
  , amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0)
  , currency VARCHAR(10) NOT NULL DEFAULT 'INR'
  , category VARCHAR(100)
  , description TEXT
  , frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'))
  , day_of_month INTEGER CHECK (
    day_of_month BETWEEN 1 AND 31
  )
  , next_due_date DATE NOT NULL
  , last_executed_date DATE
  , is_active BOOLEAN NOT NULL DEFAULT TRUE
  , created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  , updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_user_id
ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_next_due
ON recurring_transactions(next_due_date, is_active);