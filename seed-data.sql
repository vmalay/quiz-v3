-- Sample themes
INSERT INTO themes (id, name, description, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Science', 'Test your knowledge of scientific facts and discoveries', true),
('550e8400-e29b-41d4-a716-446655440002', 'History', 'Explore historical events and famous figures', true),
('550e8400-e29b-41d4-a716-446655440003', 'Geography', 'Challenge yourself with world geography questions', true);

-- Sample science questions
INSERT INTO questions (id, theme_id, question_text, options, correct_answer, difficulty) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'What is the chemical symbol for gold?', '["Go", "Au", "Gd", "Ag"]', 1, 'easy'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'What is the speed of light in vacuum?', '["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"]', 0, 'medium'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Which planet is known as the Red Planet?', '["Venus", "Jupiter", "Mars", "Saturn"]', 2, 'easy'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'What is the largest organ in the human body?', '["Brain", "Liver", "Lungs", "Skin"]', 3, 'medium'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'What gas makes up about 78% of Earth atmosphere?', '["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"]', 1, 'easy');

-- Sample history questions
INSERT INTO questions (id, theme_id, question_text, options, correct_answer, difficulty) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', 'In which year did World War II end?', '["1944", "1945", "1946", "1947"]', 1, 'easy'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'Who was the first President of the United States?', '["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"]', 1, 'easy'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'Which ancient wonder of the world was located in Alexandria?', '["Hanging Gardens", "Lighthouse", "Colossus", "Mausoleum"]', 1, 'medium'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', 'The Berlin Wall fell in which year?', '["1987", "1988", "1989", "1990"]', 2, 'medium'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'Who painted the ceiling of the Sistine Chapel?', '["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"]', 1, 'easy');

-- Sample geography questions
INSERT INTO questions (id, theme_id, question_text, options, correct_answer, difficulty) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440003', 'What is the capital of Australia?', '["Sydney", "Melbourne", "Canberra", "Perth"]', 2, 'medium'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440003', 'Which is the longest river in the world?', '["Amazon", "Nile", "Yangtze", "Mississippi"]', 1, 'easy'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440003', 'What is the smallest country in the world?', '["Monaco", "Vatican City", "San Marino", "Liechtenstein"]', 1, 'easy'),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440003', 'Which mountain range contains Mount Everest?', '["Andes", "Alps", "Himalayas", "Rockies"]', 2, 'easy'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440003', 'What is the deepest ocean trench?', '["Puerto Rico Trench", "Mariana Trench", "Java Trench", "Peru-Chile Trench"]', 1, 'medium');