package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/middleware"
	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/models"
	"github.com/KasumiMercury/cse_sync_poc/cse_sync_back/store"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:5173"
	},
}

type SignalingHandler struct {
	sessionStore    *store.SessionStore
	userStore       *store.UserStore
	deviceStore     *store.DeviceStore
	connectionStore *store.ConnectionStore
}

func NewSignalingHandler(
	sessionStore *store.SessionStore,
	userStore *store.UserStore,
	deviceStore *store.DeviceStore,
	connectionStore *store.ConnectionStore,
) *SignalingHandler {
	return &SignalingHandler{
		sessionStore:    sessionStore,
		userStore:       userStore,
		deviceStore:     deviceStore,
		connectionStore: connectionStore,
	}
}

func (h *SignalingHandler) HandleWebSocket(c echo.Context) error {
	deviceIDStr := c.QueryParam("deviceID")
	if deviceIDStr == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "deviceID is required")
	}

	deviceID, err := uuid.Parse(deviceIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid deviceID")
	}

	cookie, err := c.Cookie(middleware.SessionCookieName)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "no session")
	}

	session, exists := h.sessionStore.FindByID(cookie.Value)
	if !exists {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired session")
	}

	userID := session.UserID

	device, exists := h.deviceStore.FindByID(deviceID)
	if !exists {
		return echo.NewHTTPError(http.StatusNotFound, "device not found")
	}

	if device.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "device does not belong to user")
	}

	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return err
	}
	defer ws.Close()

	h.connectionStore.RegisterConnection(deviceID, userID, ws)
	defer h.connectionStore.RemoveConnection(deviceID)

	log.Printf("Device %s (User %s) connected to signaling server", deviceID, userID)

	for {
		var msg models.SignalingMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		if err := h.validateMessage(&msg, deviceID, userID); err != nil {
			log.Printf("Invalid message from device %s: %v", deviceID, err)
			h.sendError(ws, err.Error())
			continue
		}

		msg.From = deviceID
		msg.Timestamp = time.Now()

		if err := h.forwardMessage(&msg); err != nil {
			log.Printf("Failed to forward message: %v", err)
			h.sendError(ws, "failed to deliver message")
		}
	}

	log.Printf("Device %s (User %s) disconnected from signaling server", deviceID, userID)
	return nil
}

func (h *SignalingHandler) validateMessage(msg *models.SignalingMessage, senderDeviceID, senderUserID uuid.UUID) error {
	if msg.Type != models.MessageTypeOffer &&
		msg.Type != models.MessageTypeAnswer &&
		msg.Type != models.MessageTypeICECandidate {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid message type")
	}

	if msg.To == uuid.Nil {
		return echo.NewHTTPError(http.StatusBadRequest, "target device ID is required")
	}

	targetDevice, exists := h.deviceStore.FindByID(msg.To)
	if !exists {
		return echo.NewHTTPError(http.StatusNotFound, "target device not found")
	}

	if targetDevice.UserID != senderUserID {
		return echo.NewHTTPError(http.StatusForbidden, "cannot send message to device of different user")
	}

	if len(msg.Payload) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "payload is required")
	}

	return nil
}

func (h *SignalingHandler) forwardMessage(msg *models.SignalingMessage) error {
	targetConn := h.connectionStore.GetConnection(msg.To)
	if targetConn == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "target device is offline")
	}

	if err := targetConn.WriteJSON(msg); err != nil {
		log.Printf("Failed to send message to device %s: %v", msg.To, err)
		return err
	}

	log.Printf("Message forwarded: %s -> %s (type: %s)", msg.From, msg.To, msg.Type)
	return nil
}

func (h *SignalingHandler) sendError(ws *websocket.Conn, message string) {
	errorMsg := map[string]interface{}{
		"type":      "error",
		"message":   message,
		"timestamp": time.Now(),
	}

	if err := ws.WriteJSON(errorMsg); err != nil {
		log.Printf("Failed to send error message: %v", err)
	}
}

type ErrorMessage struct {
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}
