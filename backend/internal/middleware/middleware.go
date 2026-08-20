package middleware

import (
	"net/http"
	"strings"

	"frontline-college/backend/internal/auth"

	"github.com/gin-gonic/gin"
)

const ClaimsKey = "claims"

// RequireAuth extracts and validates the Bearer token, optionally enforcing
// a specific role (pass "" to allow any authenticated role).
func RequireAuth(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or malformed authorization header"})
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims, err := auth.ParseToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired session, please log in again"})
			return
		}
		if role != "" && claims.Role != role {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "you do not have access to this resource"})
			return
		}
		c.Set(ClaimsKey, claims)
		c.Next()
	}
}

func GetClaims(c *gin.Context) *auth.Claims {
	v, ok := c.Get(ClaimsKey)
	if !ok {
		return nil
	}
	claims, ok := v.(*auth.Claims)
	if !ok {
		return nil
	}
	return claims
}
