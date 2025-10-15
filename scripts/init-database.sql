-- Create users table for both students and teachers
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
  class_id INTEGER NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  passing_score INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK(correct_answer IN ('A', 'B', 'C', 'D')),
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

-- Create test_attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  test_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (test_id) REFERENCES tests(id)
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  selected_answer TEXT CHECK(selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Insert default teacher account (password: teacher123)
INSERT OR IGNORE INTO users (email, password, name, role) 
VALUES ('teach@test.com', '$2a$10$rKZvVxZ5qH8qYqYqYqYqYuJ5qH8qYqYqYqYqYqYqYqYqYqYqYqYqY', 'Default Teacher', 'teacher');

-- Insert default student account (password: student123)
INSERT OR IGNORE INTO users (email, password, name, role) 
VALUES ('student@test.com', '$2a$10$sKZvVxZ5qH8qYqYqYqYqYuJ5qH8qYqYqYqYqYqYqYqYqYqYqYqYqZ', 'Default Student', 'student');

-- Insert a default class and assign default student to it
INSERT OR IGNORE INTO classes (id, name) VALUES (1, 'Default Class');
UPDATE users SET class_id = 1 WHERE email = 'student@test.com';

-- Insert default admin account (password: admin123)
INSERT OR IGNORE INTO users (email, password, name, role) 
VALUES ('admin@test.com', '$2a$10$aKZvVxZ5qH8qYqYqYqYqYuJ5qH8qYqYqYqYqYqYqYqYqYqYqYqYqA', 'System Admin', 'admin');

-- Insert a sample test
INSERT OR IGNORE INTO tests (id, title, description, duration_minutes, passing_score, created_by, is_active) 
VALUES (1, 'General Knowledge Assessment', 'A comprehensive test covering various topics', 30, 70, 1, 1);

-- Insert sample questions
INSERT OR IGNORE INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, points, order_index) VALUES
(1, 'What is the capital of France?', 'London', 'Berlin', 'Paris', 'Madrid', 'C', 1, 1),
(1, 'Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'B', 1, 2),
(1, 'What is the largest ocean on Earth?', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean', 'D', 1, 3),
(1, 'Who painted the Mona Lisa?', 'Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo', 'B', 1, 4),
(1, 'What is the smallest prime number?', '0', '1', '2', '3', 'C', 1, 5),
(1, 'Which element has the chemical symbol "O"?', 'Gold', 'Oxygen', 'Silver', 'Osmium', 'B', 1, 6),
(1, 'In which year did World War II end?', '1943', '1944', '1945', '1946', 'C', 1, 7),
(1, 'What is the largest mammal in the world?', 'African Elephant', 'Blue Whale', 'Giraffe', 'Polar Bear', 'B', 1, 8),
(1, 'Which programming language is known for web development?', 'Python', 'C++', 'JavaScript', 'Swift', 'C', 1, 9),
(1, 'What is the speed of light in vacuum?', '299,792 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s', 'A', 1, 10),
(1, 'Who wrote "Romeo and Juliet"?', 'Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain', 'B', 1, 11),
(1, 'What is the hardest natural substance on Earth?', 'Gold', 'Iron', 'Diamond', 'Platinum', 'C', 1, 12),
(1, 'Which country is home to the kangaroo?', 'New Zealand', 'Australia', 'South Africa', 'Brazil', 'B', 1, 13),
(1, 'What is the main gas found in Earth''s atmosphere?', 'Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen', 'C', 1, 14),
(1, 'How many continents are there?', '5', '6', '7', '8', 'C', 1, 15);
