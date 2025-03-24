CREATE TABLE ai_message_counts (
                                   id SERIAL PRIMARY KEY,
                                   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                                   date DATE NOT NULL,
                                   count INTEGER NOT NULL DEFAULT 0,
                                   UNIQUE (user_id, date)
);