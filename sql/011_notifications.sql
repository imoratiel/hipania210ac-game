CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    turn_number INT NOT NULL, -- El turno en el que ocurrió el evento
    type VARCHAR(50),          -- 'CONSTRUCTION', 'MOVEMENT', 'COMBAT', 'ECONOMY'
    content TEXT NOT NULL,     -- El mensaje de la notificación
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_player_turn ON notifications(player_id, turn_number);