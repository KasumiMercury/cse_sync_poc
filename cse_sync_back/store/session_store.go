package store

import (
	"sync"
	"time"

	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/models"
	"github.com/google/uuid"
)

const SessionDuration = 24 * time.Hour

// SessionStore manages sessions in memory
type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*models.Session
}

// NewSessionStore creates a new SessionStore
func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string]*models.Session),
	}
}

// Create creates a new session for a user
func (s *SessionStore) Create(userID uuid.UUID) *models.Session {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	session := &models.Session{
		ID:        uuid.New().String(),
		UserID:    userID,
		CreatedAt: now,
		ExpiresAt: now.Add(SessionDuration),
	}

	s.sessions[session.ID] = session
	return session
}

// FindByID finds a session by ID
func (s *SessionStore) FindByID(sessionID string) (*models.Session, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	session, exists := s.sessions[sessionID]
	if !exists {
		return nil, false
	}

	if session.IsExpired() {
		return nil, false
	}

	return session, true
}

// Delete deletes a session
func (s *SessionStore) Delete(sessionID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.sessions, sessionID)
}

// CleanupExpired removes expired sessions
func (s *SessionStore) CleanupExpired() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for id, session := range s.sessions {
		if session.IsExpired() {
			delete(s.sessions, id)
		}
	}
}

// GetAll returns all sessions (including expired ones)
func (s *SessionStore) GetAll() []*models.Session {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sessions := make([]*models.Session, 0, len(s.sessions))
	for _, session := range s.sessions {
		sessions = append(sessions, session)
	}
	return sessions
}
