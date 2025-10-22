package handlers

import (
	"net/http"
	"time"

	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/middleware"
	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/store"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	userStore    *store.UserStore
	sessionStore *store.SessionStore
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(userStore *store.UserStore, sessionStore *store.SessionStore) *AuthHandler {
	return &AuthHandler{
		userStore:    userStore,
		sessionStore: sessionStore,
	}
}

// RegisterRequest represents the registration request body
type RegisterRequest struct {
	Username string `json:"username"`
}

// RegisterResponse represents the registration response
type RegisterResponse struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
}

// SessionResponse represents the session info response
type SessionResponse struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
}

// Register handles user registration
func (h *AuthHandler) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if req.Username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Check if user already exists
	_, exists := h.userStore.FindByUsername(req.Username)
	if exists {
		return echo.NewHTTPError(http.StatusConflict, "username already exists")
	}

	// Create new user
	user := h.userStore.Create(req.Username)

	return c.JSON(http.StatusCreated, RegisterResponse{
		UserID:   user.ID,
		Username: user.Username,
	})
}

// Login handles user login
func (h *AuthHandler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if req.Username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	// Find existing user
	user, exists := h.userStore.FindByUsername(req.Username)
	if !exists {
		return echo.NewHTTPError(http.StatusUnauthorized, "user not found")
	}

	// Create session
	session := h.sessionStore.Create(user.ID)

	// Set session cookie
	cookie := &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    session.ID,
		Expires:  session.ExpiresAt,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	}
	c.SetCookie(cookie)

	return c.JSON(http.StatusOK, LoginResponse{
		UserID:   user.ID,
		Username: user.Username,
	})
}

// GetSession returns the current session information
func (h *AuthHandler) GetSession(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(uuid.UUID)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid session")
	}

	user, exists := h.userStore.FindByID(userID)
	if !exists {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}

	return c.JSON(http.StatusOK, SessionResponse{
		UserID:   user.ID,
		Username: user.Username,
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c echo.Context) error {
	cookie, err := c.Cookie(middleware.SessionCookieName)
	if err == nil {
		h.sessionStore.Delete(cookie.Value)
	}

	// Clear cookie
	c.SetCookie(&http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   -1,
	})

	return c.NoContent(http.StatusOK)
}
