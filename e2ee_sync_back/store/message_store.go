package store

import (
	"sync"
	"time"

	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/models"
	"github.com/google/uuid"
)

// MessageStore manages messages in memory
type MessageStore struct {
	mu       sync.RWMutex
	messages map[uuid.UUID]*models.Message
}

// NewMessageStore creates a new MessageStore
func NewMessageStore() *MessageStore {
	return &MessageStore{
		messages: make(map[uuid.UUID]*models.Message),
	}
}

// Create creates a new message
func (s *MessageStore) Create(userID uuid.UUID, content string) *models.Message {
	s.mu.Lock()
	defer s.mu.Unlock()

	message := &models.Message{
		ID:        uuid.New(),
		UserID:    userID,
		Content:   content,
		CreatedAt: time.Now(),
	}

	s.messages[message.ID] = message

	return message
}

// GetAll returns all messages sorted by creation time
func (s *MessageStore) GetAll() []*models.Message {
	s.mu.RLock()
	defer s.mu.RUnlock()

	messages := make([]*models.Message, 0, len(s.messages))
	for _, message := range s.messages {
		messages = append(messages, message)
	}
	return messages
}

// FindByUserID returns all messages from a specific user
func (s *MessageStore) FindByUserID(userID uuid.UUID) []*models.Message {
	s.mu.RLock()
	defer s.mu.RUnlock()

	messages := make([]*models.Message, 0)
	for _, message := range s.messages {
		if message.UserID == userID {
			messages = append(messages, message)
		}
	}
	return messages
}
