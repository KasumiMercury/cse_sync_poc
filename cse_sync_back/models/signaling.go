package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type SignalingMessageType string

const (
	MessageTypeOffer        SignalingMessageType = "offer"
	MessageTypeAnswer       SignalingMessageType = "answer"
	MessageTypeICECandidate SignalingMessageType = "ice-candidate"
)

type SignalingMessage struct {
	Type      SignalingMessageType `json:"type"`
	From      uuid.UUID            `json:"from"`
	To        uuid.UUID            `json:"to"`
	Payload   json.RawMessage      `json:"payload"`
	Timestamp time.Time            `json:"timestamp"`
}
