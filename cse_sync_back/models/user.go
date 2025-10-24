package models

import "github.com/google/uuid"

// User represents a user in the system
type User struct {
	ID                 uuid.UUID `json:"id"`
	Username           string    `json:"username"`
	RecoveryWrappedUMK string    `json:"recovery_wrapped_umk,omitempty"`
	RecoverySalt       string    `json:"recovery_salt,omitempty"`
	RecoveryIV         string    `json:"recovery_iv,omitempty"`
}
