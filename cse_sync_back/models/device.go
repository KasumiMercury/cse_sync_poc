package models

import (
	"time"

	"github.com/google/uuid"
)

type Device struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	WrappedUMK string    `json:"wrapped_umk"`
	CreatedAt  time.Time `json:"created_at"`
}

func NewDevice(userID uuid.UUID, wrappedUMK string) *Device {
	return &Device{
		ID:         uuid.New(),
		UserID:     userID,
		WrappedUMK: wrappedUMK,
		CreatedAt:  time.Now(),
	}
}
