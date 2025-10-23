package handlers

import (
	"net/http"

	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/middleware"
	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/store"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// MessageHandler handles message endpoints
type MessageHandler struct {
	userStore    *store.UserStore
	messageStore *store.MessageStore
}

// NewMessageHandler creates a new MessageHandler
func NewMessageHandler(userStore *store.UserStore, messageStore *store.MessageStore) *MessageHandler {
	return &MessageHandler{
		userStore:    userStore,
		messageStore: messageStore,
	}
}

// SendMessageRequest represents the message creation request body
type SendMessageRequest struct {
	Content string `json:"content"`
	Nonce   string `json:"nonce"`
}

// SendMessage handles message creation
func (h *MessageHandler) SendMessage(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(uuid.UUID)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid session")
	}

	var req SendMessageRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if req.Content == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "content is required")
	}

	// Create message
	message := h.messageStore.Create(userID, req.Content, req.Nonce)

	return c.JSON(http.StatusCreated, message)
}

// GetMessages returns all messages
func (h *MessageHandler) GetMessages(c echo.Context) error {
	_, ok := c.Get(middleware.UserIDContextKey).(uuid.UUID)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid session")
	}

	messages := h.messageStore.GetAll()

	return c.JSON(http.StatusOK, messages)
}
