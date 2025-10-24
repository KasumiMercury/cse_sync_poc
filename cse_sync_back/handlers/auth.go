package handlers

import (
	"net/http"
	"time"

	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/middleware"
	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/store"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	userStore    *store.UserStore
	sessionStore *store.SessionStore
	deviceStore  *store.DeviceStore
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(userStore *store.UserStore, sessionStore *store.SessionStore, deviceStore *store.DeviceStore) *AuthHandler {
	return &AuthHandler{
		userStore:    userStore,
		sessionStore: sessionStore,
		deviceStore:  deviceStore,
	}
}

// RegisterInitRequest represents the initial registration payload
type RegisterInitRequest struct {
	Username string `json:"username"`
}

// RegisterInitResponse carries user identity back to the client
type RegisterInitResponse struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
}

// RecoveryPayload represents the UMK recovery payload encrypted with a passphrase
type RecoveryPayload struct {
	WrappedUMK string `json:"wrapped_umk"`
	Salt       string `json:"salt"`
	IV         string `json:"iv"`
}

// RegisterRequest represents the final registration payload
type RegisterRequest struct {
	WrappedUMK string          `json:"wrapped_umk"`
	Recovery   RecoveryPayload `json:"recovery"`
}

// RegisterResponse represents the registration response
type RegisterResponse struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	DeviceID uuid.UUID `json:"device_id"`
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	UserID     uuid.UUID `json:"user_id"`
	Username   string    `json:"username"`
	DeviceID   uuid.UUID `json:"device_id"`
	WrappedUMK string    `json:"wrapped_umk"` // Base64-encoded wrapped UMK
}

// SessionResponse represents the session info response
type SessionResponse struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
}

// Register handles user registration and device provisioning
func (h *AuthHandler) RegisterInit(c echo.Context) error {
	var req RegisterInitRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if req.Username == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "username is required")
	}

	if _, exists := h.userStore.FindByUsername(req.Username); exists {
		return echo.NewHTTPError(http.StatusConflict, "username already exists")
	}

	user := h.userStore.Create(req.Username)
	session := h.sessionStore.Create(user.ID)

	cookie := &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    session.ID,
		Expires:  session.ExpiresAt,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	}
	c.SetCookie(cookie)

	return c.JSON(http.StatusCreated, RegisterInitResponse{
		UserID:   user.ID,
		Username: user.Username,
	})
}

// Register handles device key registration after initialization
func (h *AuthHandler) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if req.WrappedUMK == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "wrapped_umk is required")
	}

	if req.Recovery.WrappedUMK == "" || req.Recovery.Salt == "" || req.Recovery.IV == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "recovery payload is required")
	}

	cookie, err := c.Cookie(middleware.SessionCookieName)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "registration session not found")
	}

	session, exists := h.sessionStore.FindByID(cookie.Value)
	if !exists {
		return echo.NewHTTPError(http.StatusUnauthorized, "registration session expired")
	}

	user, exists := h.userStore.FindByID(session.UserID)
	if !exists {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}

	if _, ok := h.userStore.UpdateRecoveryData(user.ID, req.Recovery.WrappedUMK, req.Recovery.Salt, req.Recovery.IV); !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to persist recovery data")
	}

	device := h.deviceStore.Create(user.ID, req.WrappedUMK)

	return c.JSON(http.StatusCreated, RegisterResponse{
		UserID:   user.ID,
		Username: user.Username,
		DeviceID: device.ID,
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

	// Find user's devices
	devices := h.deviceStore.FindByUserID(user.ID)
	if len(devices) == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "no device found for user")
	}

	// For PoC, use the first device
	// In production, client should specify deviceID or handle multiple devices
	device := devices[0]

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
		UserID:     user.ID,
		Username:   user.Username,
		DeviceID:   device.ID,
		WrappedUMK: device.WrappedUMK,
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
