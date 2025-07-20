-- Quiz Battle Database Schema Setup
-- Run this in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create themes table
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id TEXT NOT NULL,
    player2_id TEXT,
    theme_id UUID REFERENCES themes(id),
    status TEXT NOT NULL DEFAULT 'waiting',
    winner_id TEXT,
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    current_question_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    question_id UUID NOT NULL REFERENCES questions(id),
    selected_answer INTEGER,
    is_correct BOOLEAN,
    response_time_ms INTEGER,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_theme_id ON questions(theme_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_theme_id ON games(theme_id);
CREATE INDEX IF NOT EXISTS idx_answers_game_id ON answers(game_id);
CREATE INDEX IF NOT EXISTS idx_answers_player_id ON answers(player_id);

-- Insert sample themes
INSERT INTO themes (id, name, description, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Science', 'Test your knowledge of scientific facts and discoveries', true),
    ('550e8400-e29b-41d4-a716-446655440002', 'History', 'Explore historical events and famous figures', true),
    ('550e8400-e29b-41d4-a716-446655440003', 'Geography', 'Challenge yourself with world geography questions', true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample science questions
INSERT INTO questions (id, theme_id, question_text, options, correct_answer, difficulty) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'What is the chemical symbol for gold?', '["Go", "Au", "Gd", "Ag"]', 1, 'easy'),
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'What is the speed of light in vacuum?', '["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"]', 0, 'medium'),
    ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Which planet is known as the Red Planet?', '["Venus", "Jupiter", "Mars", "Saturn"]', 2, 'easy'),
    ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'What is the largest organ in the human body?', '["Brain", "Liver", "Lungs", "Skin"]', 3, 'medium'),
    ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'What gas makes up about 78% of Earth atmosphere?', '["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"]', 1, 'easy')
ON CONFLICT (id) DO NOTHING;

-- Insert sample history questions
INSERT INTO questions (id, theme_id, question_text, options, correct_answer, difficulty) VALUES
    ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', 'In which year did World War II end?', '["1944", "1945", "1946", "1947"]', 1, 'easy'),
    ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'Who was the first President of the United States?', '["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"]', 1, 'easy'),
    ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'Which ancient wonder of the world was located in Alexandria?', '["Hanging Gardens", "Lighthouse", "Colossus", "Mausoleum"]', 1, 'medium'),
    ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', 'The Berlin Wall fell in which year?', '["1987", "1988", "1989", "1990"]', 2, 'medium'),
    ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'Who painted the ceiling of the Sistine Chapel?', '["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"]', 1, 'easy')
ON CONFLICT (id) DO NOTHING;

-- Insert sample geography questions
INSERT INTO questions (id, theme_id, question_text, options, correct_answer, difficulty) VALUES
    ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440003', 'What is the capital of Australia?', '["Sydney", "Melbourne", "Canberra", "Perth"]', 2, 'medium'),
    ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440003', 'Which is the longest river in the world?', '["Amazon", "Nile", "Yangtze", "Mississippi"]', 1, 'easy'),
    ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440003', 'What is the smallest country in the world?', '["Monaco", "Vatican City", "San Marino", "Liechtenstein"]', 1, 'easy'),
    ('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440003', 'Which mountain range contains Mount Everest?', '["Andes", "Alps", "Himalayas", "Rockies"]', 2, 'easy'),
    ('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440003', 'What is the deepest ocean trench?', '["Puerto Rico Trench", "Mariana Trench", "Java Trench", "Peru-Chile Trench"]', 1, 'medium')
ON CONFLICT (id) DO NOTHING;