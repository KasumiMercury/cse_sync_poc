package models

import (
	"time"

	"github.com/google/uuid"
)

// Message represents a message in the system
type Message struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"user_id"`
	EncryptedContent string    `json:"encrypted_content"`
	Nonce            string    `json:"nonce"`
	CreatedAt        time.Time `json:"created_at"`
}
