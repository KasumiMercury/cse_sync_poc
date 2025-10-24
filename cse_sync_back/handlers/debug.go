package handlers

import (
	"net/http"

	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/models"
	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/store"
	"github.com/labstack/echo/v4"
)

// DebugHandler handles debug endpoints
type DebugHandler struct {
	userStore    *store.UserStore
	sessionStore *store.SessionStore
	deviceStore  *store.DeviceStore
	messageStore *store.MessageStore
}

// NewDebugHandler creates a new DebugHandler
func NewDebugHandler(userStore *store.UserStore, sessionStore *store.SessionStore, deviceStore *store.DeviceStore, messageStore *store.MessageStore) *DebugHandler {
	return &DebugHandler{
		userStore:    userStore,
		sessionStore: sessionStore,
		deviceStore:  deviceStore,
		messageStore: messageStore,
	}
}

// DebugResponse represents the debug information response
type DebugResponse struct {
	Users    []*models.User    `json:"users"`
	Sessions []*models.Session `json:"sessions"`
	Devices  []*models.Device  `json:"devices"`
	Messages []*models.Message `json:"messages"`
}

// GetDebugInfo returns all users, sessions, devices, and messages for debugging
func (h *DebugHandler) GetDebugInfo(c echo.Context) error {
	users := h.userStore.GetAll()
	sessions := h.sessionStore.GetAll()
	devices := h.deviceStore.GetAll()
	messages := h.messageStore.GetAll()

	return c.JSON(http.StatusOK, DebugResponse{
		Users:    users,
		Sessions: sessions,
		Devices:  devices,
		Messages: messages,
	})
}
