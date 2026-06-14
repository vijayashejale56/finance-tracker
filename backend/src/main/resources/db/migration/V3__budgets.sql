CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , user_id UUID NOT NULL REFERENCES users(id)
  ON DELETE CASCADE
  , category VARCHAR(100) NOT NULL
  , limit_amount DECIMAL(19, 4) NOT NULL CHECK (limit_amount > 0)
  , month INTEGER NOT NULL CHECK (
    month BETWEEN 1 AND 12
  )
  , year INTEGER NOT NULL CHECK (year >= 2020)
  , created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  , updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  , -- One budget per category per month per user
    UNIQUE(user_id, category, month, year)
);

CREATE INDEX idx_budgets_user_id
ON budgets(user_id);
CREATE INDEX idx_budgets_user_month_year
ON budgets(user_id, month, year);