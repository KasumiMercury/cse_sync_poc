package handlers

import (
	"net/http"
	"time"

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

type DeviceRegisterRequest struct {
	WrappedUMK string `json:"wrapped_umk"`
}

type DeviceRegisterResponse struct {
	DeviceID  uuid.UUID `json:"device_id"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *DeviceHandler) RegisterDevice(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(uuid.UUID)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid session")
	}

	var req DeviceRegisterRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if req.WrappedUMK == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "wrapped_umk is required")
	}

	device := h.deviceStore.Create(userID, req.WrappedUMK)

	return c.JSON(http.StatusCreated, DeviceRegisterResponse{
		DeviceID:  device.ID,
		CreatedAt: device.CreatedAt,
	})
}
