CREATE TABLE IF NOT EXISTS applications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company VARCHAR(200) NOT NULL,
  role VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  job_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'saved',
  deadline_date DATE,
  applied_date DATE,
  next_action_text TEXT,
  next_action_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT applications_status_check CHECK (
    status IN (
      'saved',
      'preparing',
      'applied',
      'interview',
      'rejected',
      'offer',
      'accepted',
      'withdrawn',
      'closed'
    )
  ),
  CONSTRAINT applications_applied_date_check CHECK (
    applied_date IS NULL OR status NOT IN ('saved', 'preparing')
  )
);
