package middleware

import (
	"net/http"

	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/store"
	"github.com/labstack/echo/v4"
)

const (
	SessionCookieName = "session_id"
	UserIDContextKey  = "user_id"
)

// SessionMiddleware validates session from cookie
func SessionMiddleware(sessionStore *store.SessionStore, userStore *store.UserStore) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			cookie, err := c.Cookie(SessionCookieName)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "no session")
			}

			session, exists := sessionStore.FindByID(cookie.Value)
			if !exists {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired session")
			}

			// Store user ID in context
			c.Set(UserIDContextKey, session.UserID)

			return next(c)
		}
	}
}
