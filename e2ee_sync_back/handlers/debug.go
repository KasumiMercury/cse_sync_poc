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
	deviceStore  *store.DeviceStore
}

// NewDebugHandler creates a new DebugHandler
func NewDebugHandler(userStore *store.UserStore, sessionStore *store.SessionStore, deviceStore *store.DeviceStore) *DebugHandler {
	return &DebugHandler{
		userStore:    userStore,
		sessionStore: sessionStore,
		deviceStore:  deviceStore,
	}
}

// DebugResponse represents the debug information response
type DebugResponse struct {
	Users    []*models.User    `json:"users"`
	Sessions []*models.Session `json:"sessions"`
	Devices  []*models.Device  `json:"devices"`
}

// GetDebugInfo returns all users, sessions, and devices for debugging
func (h *DebugHandler) GetDebugInfo(c echo.Context) error {
	users := h.userStore.GetAll()
	sessions := h.sessionStore.GetAll()
	devices := h.deviceStore.GetAll()

	return c.JSON(http.StatusOK, DebugResponse{
		Users:    users,
		Sessions: sessions,
		Devices:  devices,
	})
}
