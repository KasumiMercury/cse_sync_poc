package main

import (
	"time"

	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/handlers"
	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/middleware"
	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/store"
	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
)

func main() {
	// Initialize stores
	userStore := store.NewUserStore()
	sessionStore := store.NewSessionStore()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userStore, sessionStore)
	debugHandler := handlers.NewDebugHandler(userStore, sessionStore)

	// Create Echo instance
	e := echo.New()

	// Middleware
	e.Use(echoMiddleware.Logger())
	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Public routes
	e.POST("/api/register", authHandler.Register)
	e.POST("/api/login", authHandler.Login)
	e.GET("/api/debug", debugHandler.GetDebugInfo)

	// Protected routes
	protected := e.Group("/api")
	protected.Use(middleware.SessionMiddleware(sessionStore, userStore))
	protected.GET("/session", authHandler.GetSession)
	protected.POST("/logout", authHandler.Logout)

	// Start cleanup goroutine
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			sessionStore.CleanupExpired()
		}
	}()

	// Start server
	e.Logger.Fatal(e.Start(":8080"))
}
