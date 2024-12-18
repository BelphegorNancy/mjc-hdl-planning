-- Table des salles
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des activités
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructor TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des réservations
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    room_id TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- Index pour optimiser les recherches de chevauchements
CREATE INDEX IF NOT EXISTS idx_reservations_room_time 
ON reservations(room_id, start_time, end_time);

-- Insertion de données de test
INSERT OR IGNORE INTO rooms (id, name, capacity, color) VALUES
('1', 'Salle A', 20, '#FF0000'),
('2', 'Salle B', 15, '#00FF00'),
('3', 'Salle C', 30, '#0000FF');

INSERT OR IGNORE INTO activities (id, name, description, instructor) VALUES
('1', 'Yoga', 'Cours de yoga pour débutants', 'Marie'),
('2', 'Pilates', 'Renforcement musculaire', 'Pierre'),
('3', 'Méditation', 'Séance de méditation guidée', 'Sophie');
