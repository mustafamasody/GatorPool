package handler

import (
	"context"
	"fmt"
	"net/http"

	"code.gatorpool.internal/guardian/session"
	"code.gatorpool.internal/util"
	"go.mongodb.org/mongo-driver/bson"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
)

func VerifyToken(r *http.Request, w http.ResponseWriter, ctx context.Context) {

	token := ""
	for _, cookie := range r.Cookies() {
		if cookie.Name == "X-GatorPool-Bearer" {
			token = cookie.Value
			break
		}
	}

	if token == "" {
		token = r.Header.Get("X-GatorPool-Bearer")
	}

	tokenRefreshed := false
	newToken := ""
	newRefreshToken := ""

	scope := "internal"

	if token == "" {

		// Get refresh token
		refreshToken := ""
		header := false
		for _, cookie := range r.Cookies() {
			if cookie.Name == "X-GatorPool-Refresh" {
				refreshToken = cookie.Value
				break
			}
		}

		if refreshToken == "" {
			refreshToken = r.Header.Get("X-GatorPool-Refresh")
			header = true
		}

		if refreshToken == "" {
			util.JSONResponse(w, http.StatusUnauthorized, map[string]interface{}{"error": "Unauthorized"})
			return
		}

		if header {
			scope = "external"
		}

		// Refresh token flow
		newAuthToken, refreshTokenPtr, _, _, _, err := session.RefreshOAuth2Token(scope, r, w, &refreshToken)
		if err != nil {
			util.JSONResponse(w, http.StatusUnauthorized, map[string]interface{}{"error": "Unauthorized"})
			return
		}

		tokenRefreshed = true
		newToken = *newAuthToken
		newRefreshToken = *refreshTokenPtr

		if scope == "internal" {

			// Set cookies
			http.SetCookie(w, &http.Cookie{
				Name:     "X-GatorPool-Refresh",
				Value:    newRefreshToken,
				HttpOnly: true,
				Secure:   true,
				Path:     "/",
				MaxAge:   604800 * 4, // 28 days
				SameSite: http.SameSiteStrictMode,
			})
	
			http.SetCookie(w, &http.Cookie{
				Name:     "X-GatorPool-Bearer",
				Value:    newToken,
				HttpOnly: true,
				Secure:   true,
				Path:     "/",
				MaxAge:   3600 * 24, // 24 hours
				SameSite: http.SameSiteStrictMode,
			})
		}

	} else {
		// Verify token flow 
		_, err := session.VerifyOAuthTokenInternal(r, w, context.Background())
		if err != nil {
			// Get refresh token
			refreshToken := ""
			header := false
			for _, cookie := range r.Cookies() {
				if cookie.Name == "X-GatorPool-Refresh" {
					fmt.Println("cookie refresh token")
					refreshToken = cookie.Value
					break
				}
			}

			if refreshToken == "" {
				fmt.Println("header refresh token")
				refreshToken = r.Header.Get("X-GatorPool-Refresh")
				header = true
			}

			if refreshToken == "" {
				fmt.Println("No refresh token")
				util.JSONResponse(w, http.StatusUnauthorized, map[string]interface{}{"error": "Unauthorized 2"})
				return
			}

			if header {
				scope = "external"
			}

			fmt.Println("refresh token: " + refreshToken)

			// Refresh token flow
			newAuthToken, refreshTokenPtr, _, _, _, err := session.RefreshOAuth2Token(scope, r, w, &refreshToken)
			if err != nil {
				fmt.Println("err: " + err.Error())
				util.JSONResponse(w, http.StatusUnauthorized, map[string]interface{}{"error": "Unauthorized 3"})
				return
			}

			tokenRefreshed = true
			newToken = *newAuthToken
			newRefreshToken = *refreshTokenPtr

			if scope == "internal" {

				// Set cookies
				http.SetCookie(w, &http.Cookie{
					Name:     "X-GatorPool-Refresh",
					Value:    newRefreshToken,
					HttpOnly: true,
					Secure:   true,
					Path:     "/",
					MaxAge:   604800 * 4, // 28 days
					SameSite: http.SameSiteStrictMode,
				})
		
				http.SetCookie(w, &http.Cookie{
					Name:     "X-GatorPool-Bearer",
					Value:    newToken,
					HttpOnly: true,
					Secure:   true,
					Path:     "/",
					MaxAge:   3600 * 24, // 24 hours
					SameSite: http.SameSiteStrictMode,
				})

				fmt.Println("Set cookies")
				fmt.Println(newToken)
				fmt.Println(newRefreshToken)
			}
		}
	}

	var account accountEntities.AccountEntity

	accountCollection := datastores.GetMongoDatabase(context.Background()).Collection(datastores.Accounts)

	email := r.Header.Get("X-GatorPool-Username")

	err := accountCollection.FindOne(context.Background(), bson.D{{Key: "email", Value: email}}).Decode(&account)
	if err != nil {
		util.JSONResponse(w, http.StatusInternalServerError, map[string]interface{}{"error": "Internal server error"})
		return
	}

	if !*account.IsVerified || !*account.IsComplete {
		util.JSONResponse(w, http.StatusForbidden, map[string]interface{}{"success": true, "message": "account_not_complete"})
		return
	}

	response := map[string]interface{}{
		"success": true,
	}

	if tokenRefreshed && scope == "external" {
		response["access_token"] = newToken
		response["refresh_token"] = newRefreshToken
	}

	util.JSONResponse(w, http.StatusOK, response)
	
}