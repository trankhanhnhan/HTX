```sql
-- Create Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, 
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert default admin account
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2a$10$xXmhB5ES.DIrB1UxM4hK8eqPBGCB8UFgfYlUxuJ0bAeZH0JqcEgp.', 'admin');
-- Password is 'admin123' hashed with bcrypt
```
