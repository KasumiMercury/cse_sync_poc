package store

import (
	"sync"

	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/models"
	"github.com/google/uuid"
)

// UserStore manages users in memory
type UserStore struct {
	mu              sync.RWMutex
	users           map[uuid.UUID]*models.User
	usernameToIDMap map[string]uuid.UUID
}

// NewUserStore creates a new UserStore
func NewUserStore() *UserStore {
	return &UserStore{
		users:           make(map[uuid.UUID]*models.User),
		usernameToIDMap: make(map[string]uuid.UUID),
	}
}

// FindByUsername finds a user by username
func (s *UserStore) FindByUsername(username string) (*models.User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	userID, exists := s.usernameToIDMap[username]
	if !exists {
		return nil, false
	}

	user, exists := s.users[userID]
	return user, exists
}

// FindByID finds a user by ID
func (s *UserStore) FindByID(id uuid.UUID) (*models.User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	user, exists := s.users[id]
	return user, exists
}

// Create creates a new user
func (s *UserStore) Create(username string) *models.User {
	s.mu.Lock()
	defer s.mu.Unlock()

	user := &models.User{
		ID:       uuid.New(),
		Username: username,
	}

	s.users[user.ID] = user
	s.usernameToIDMap[username] = user.ID

	return user
}

// UpdateRecoveryData stores the user's passphrase-based recovery payload
func (s *UserStore) UpdateRecoveryData(userID uuid.UUID, wrappedUMK, salt, iv string) (*models.User, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, exists := s.users[userID]
	if !exists {
		return nil, false
	}

	user.RecoveryWrappedUMK = wrappedUMK
	user.RecoverySalt = salt
	user.RecoveryIV = iv

	return user, true
}

// GetOrCreate finds a user by username or creates a new one
func (s *UserStore) GetOrCreate(username string) *models.User {
	user, exists := s.FindByUsername(username)
	if exists {
		return user
	}
	return s.Create(username)
}

// GetAll returns all users
func (s *UserStore) GetAll() []*models.User {
	s.mu.RLock()
	defer s.mu.RUnlock()

	users := make([]*models.User, 0, len(s.users))
	for _, user := range s.users {
		users = append(users, user)
	}
	return users
}
