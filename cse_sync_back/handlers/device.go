package handlers

import (
	"net/http"

	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/middleware"
	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/store"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// DeviceHandler handles device-related endpoints
type DeviceHandler struct {
	deviceStore *store.DeviceStore
}

// NewDeviceHandler creates a new DeviceHandler instance
func NewDeviceHandler(deviceStore *store.DeviceStore) *DeviceHandler {
	return &DeviceHandler{
		deviceStore: deviceStore,
	}
}

// GetDevice returns the device information for the authenticated user
func (h *DeviceHandler) GetDevice(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(uuid.UUID)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid session")
	}

	deviceIDParam := c.Param("deviceID")
	deviceID, err := uuid.Parse(deviceIDParam)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid device id")
	}

	device, exists := h.deviceStore.FindByID(deviceID)
	if !exists {
		return echo.NewHTTPError(http.StatusNotFound, "device not found")
	}

	if device.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "device does not belong to session user")
	}

	return c.JSON(http.StatusOK, device)
}
