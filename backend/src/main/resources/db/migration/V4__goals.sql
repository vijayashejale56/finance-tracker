CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  , name VARCHAR(255) NOT NULL
  , target_amount DECIMAL(19, 4) NOT NULL CHECK (target_amount > 0)
  , current_amount DECIMAL(19, 4) NOT NULL DEFAULT 0
  , deadline DATE NOT NULL
  , status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS'
  , linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL
  , notes TEXT
  , created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  , updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  , UNIQUE(user_id, name)
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(user_id, status);
