package handlers

import (
	"net/http"

	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/models"
	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/store"
	"github.com/labstack/echo/v4"
)

// DebugHandler handles debug endpoints
type DebugHandler struct {
	userStore    *store.UserStore
	sessionStore *store.SessionStore
}

// NewDebugHandler creates a new DebugHandler
func NewDebugHandler(userStore *store.UserStore, sessionStore *store.SessionStore) *DebugHandler {
	return &DebugHandler{
		userStore:    userStore,
		sessionStore: sessionStore,
	}
}

// DebugResponse represents the debug information response
type DebugResponse struct {
	Users    []*models.User    `json:"users"`
	Sessions []*models.Session `json:"sessions"`
}

// GetDebugInfo returns all users and sessions for debugging
func (h *DebugHandler) GetDebugInfo(c echo.Context) error {
	users := h.userStore.GetAll()
	sessions := h.sessionStore.GetAll()

	return c.JSON(http.StatusOK, DebugResponse{
		Users:    users,
		Sessions: sessions,
	})
}
