```mermaid
erDiagram
    PRODUCT_TYPES {
        string productId PK 
        string name
        string image
        string expiryDate 
        timestamp created_at
    }

    BATCHES {
        string batch_code PK 
        string product_id FK
        string productionDate
        string expiryDate
        decimal weight
        string phone
        string qr_image
        timestamp created_at 
    }

    PLOTS {
        string batch_code PK
        decimal total_area
        decimal free_area 
        string status
        timestamp created_at
    }

    DIARIES {
        string index PK
        string batch_code FK
        string product_id FK
        string name
        string origin
        string season
        date plantDate
        decimal area
        string stage
        string note
        timestamp created_at
    }

    DIARY_PROCESS {
        string index PK "Links to DIARIES"
        string stage 
        datetime date
        string content
        string imageProd
        timestamp created_at
    }

    COMPLETED_DIARIES {
        string batch_code PK
        string product_id FK 
        decimal outputQty
        string tracingStatus
        timestamp completedDate
    }

    PRODUCT_TYPES ||--o{ BATCHES : has
    BATCHES ||--o{ DIARIES : contains
    PLOTS ||--|| BATCHES : tracks
    DIARIES ||--o{ DIARY_PROCESS : details
    DIARIES ||--o{ COMPLETED_DIARIES : completed

```

```sql
-- Create database
CREATE DATABASE htx_traceability;
USE htx_traceability;

-- Product Types
CREATE TABLE product_types (
    productId VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image VARCHAR(255),
    expiryDate VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches
CREATE TABLE batches (
    batch_code VARCHAR(20) PRIMARY KEY,
    product_id VARCHAR(10),
    productionDate DATE,
    expiryDate DATE, 
    weight DECIMAL(10,2),
    phone VARCHAR(20),
    qr_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product_types(productId)
);

-- Plots
CREATE TABLE plots (
    batch_code VARCHAR(20) PRIMARY KEY,
    total_area DECIMAL(10,3),
    free_area DECIMAL(10,3),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_code) REFERENCES batches(batch_code)
);

-- Diaries
CREATE TABLE diaries (
    index VARCHAR(20) PRIMARY KEY,
    batch_code VARCHAR(20),
    product_id VARCHAR(10),
    name VARCHAR(100),
    origin VARCHAR(100),
    season VARCHAR(50),
    plantDate DATE,
    area DECIMAL(10,2),
    stage VARCHAR(50),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_code) REFERENCES batches(batch_code),
    FOREIGN KEY (product_id) REFERENCES product_types(productId)
);

-- Diary Process
CREATE TABLE diary_process (
    id INT AUTO_INCREMENT PRIMARY KEY,
    index VARCHAR(20),
    stage VARCHAR(50),
    date DATETIME,
    content TEXT,
    imageProd VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (index) REFERENCES diaries(index)
);

-- Completed Diaries
CREATE TABLE completed_diaries (
    batch_code VARCHAR(20) PRIMARY KEY,
    product_id VARCHAR(10),
    outputQty DECIMAL(10,2),
    tracingStatus VARCHAR(50),
    completedDate TIMESTAMP,
    FOREIGN KEY (batch_code) REFERENCES batches(batch_code),
    FOREIGN KEY (product_id) REFERENCES product_types(productId) 
);
```