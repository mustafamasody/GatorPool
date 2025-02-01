package oauth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	passwordEntity "code.gatorpool.internal/guardian/password"
	"code.gatorpool.internal/guardian/secrets"
	"code.gatorpool.internal/guardian/session"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"github.com/charmbracelet/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type OAuthBody struct {
	Username  *string `json:"username"`
	Password  *string `json:"password"`
	GrantType *string `json:"grant_type"`
	Scope     *string `json:"scope"`
	MFACode   *string `json:"mfa_code"`
}

func OAuthToken(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Set the logger
	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    true,                  // Report the file name and line number
		ReportTimestamp: true,                  // Report the timestamp
		TimeFormat:      "2006-01-02 15:04:05", // Set the time format
		Prefix:          "OAUTH (OA)",          // Set the prefix
	})

	var body OAuthBody
	err := json.NewDecoder(req.Body).Decode(&body)
	if err != nil {
		logger.Error("Failed to decode request body")
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "invalid request body"})
	}

	if body.Username == nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "username is required"})
	}

	username := *body.Username

	if body.Scope == nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "scope is required"})
	}

	if *body.Scope != "internal" && *body.Scope != "external" {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "invalid scope"})
	}

	accountCollection := datastores.GetMongoDatabase(ctx).Collection(datastores.Accounts)

	accountQuery := bson.D{{Key: "email", Value: username}}
	var account *accountEntities.AccountEntity
	err = accountCollection.FindOne(ctx, accountQuery).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"error": "account not found"})
		}
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	if !*account.IsVerified {
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{"error": "account not verified or incomplete"})
	}

	if body.GrantType == nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "grant_type is required"})
	}

	grantType := *body.GrantType

	if grantType == "password" {

		verified, err := passwordEntity.VerifyPassword(body.Password, account.Password.Hash, account.Password.EncryptedVersion)
		if err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}

		if !verified {
			return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{"error": "invalid credentials"})
		}

		if account.TwoFAEnabled != nil && *account.TwoFAEnabled {

			// Check 2FA settings
			err = OAuthTwoFactorAuthentication(req, &body, account, ctx)
			if err != nil {
				return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{"error": err.Error()})
			}

			// Account has 2FA enabled
			return IssueOAuthResponse(true, &body, req, res, ctx)

		} else {

			if !*account.IsComplete {
				return IssueOAuthResponse(false, &body, req, res, ctx)
			}

			// Account does not have 2FA enabled
			return IssueOAuthResponse(true, &body, req, res, ctx)
		}
	} else if grantType == "refresh" {

		// Get the verified device, check if the refresh token is valid
		sessions := account.Sessions
		var foundSession *accountEntities.Session
		var found bool
		for _, session := range sessions {
			if session.RefreshToken != nil {
				if *body.Scope == "external" && *session.RefreshToken == *body.Password {
					foundSession = session
					found = true
					break
				} else if *body.Scope == "internal" {

					// Get the X-GatorPool-Refresh cookie
					refreshCookie, err := req.Cookie("X-GatorPool-Refresh")
					if err != nil {
						return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{"error": "refresh token not found"})
					}

					if *session.RefreshToken == refreshCookie.Value {
						foundSession = session
						found = true
						break
					} else {
						continue
					}
				} else {
					continue
				}
			}
		}

		if !found {
			return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{"error": "invalid refresh token"})
		}

		// Check if the refresh token is expired
		if foundSession.RefreshIssuedAt.Add(time.Hour * 24 * 28).Before(time.Now()) {
			return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{"error": "refresh token expired"})
		}

		if *body.Scope == "internal" {

			// Get the X-GatorPool-Refresh cookie
			refreshCookie, err := req.Cookie("X-GatorPool-Refresh")
			if err != nil {
				return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{"error": "refresh token not found"})
			}

			accessToken, refreshToken, _, _, _, err := session.RefreshOAuth2Token("internal", req, res, &refreshCookie.Value)
			if err != nil {
				return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
			}

			http.SetCookie(res, &http.Cookie{
				Name:     "X-GatorPool-Refresh",
				Value:    *refreshToken,
				HttpOnly: true,
				Secure:   true,
				Path:     "/",
				MaxAge:   604800 * 4, // 28 days
				SameSite: http.SameSiteStrictMode,
			})

			http.SetCookie(res, &http.Cookie{
				Name:     "X-GatorPool-Bearer",
				Value:    *accessToken,
				HttpOnly: true,
				Secure:   true,
				Path:     "/",
				MaxAge:   3600 * 24, // 1 hour
				SameSite: http.SameSiteStrictMode,
			})

			return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
				"success": true,
				"message": "session issued",
			})
		} else {

			accessToken, refreshToken, _, _, _, err := session.RefreshOAuth2Token("external", req, res, body.Password)
			if err != nil {
				return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
			}

			return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
				"access_token":  *accessToken,
				"token_type":    "bearer",
				"refresh_token": *refreshToken,
			})
		}
	} else if *body.GrantType == "revoke" {

		err := session.RevokeOAuth2Token(req, res, ctx)
		if err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}

		if *body.Scope == "internal" {
			// Remove the token cookies
			http.SetCookie(res, &http.Cookie{
				Name:     "X-GatorPool-Refresh",
				Value:    "",
				HttpOnly: true,
				Secure:   true,
				Path:     "/",
				MaxAge:   -1,
			})

			http.SetCookie(res, &http.Cookie{
				Name:     "X-GatorPool-Bearer",
				Value:    "",
				HttpOnly: true,
				Secure:   true,
				Path:     "/",
				MaxAge:   -1,
			})
		}

		return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
			"success": true,
			"message": "session revoked",
		})

	} else {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "invalid grant_type"})
	}
}

func IssueOAuthResponse(accountComplete bool, body *OAuthBody, req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Issue token
	token, _, refreshToken, _, _, err := session.GenerateOAuth2Token(req, res, ctx)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	redirectToOnboarding := !accountComplete

	if *body.Scope == "internal" {

		http.SetCookie(res, &http.Cookie{
			Name:     "X-GatorPool-Refresh",
			Value:    *refreshToken,
			HttpOnly: true,
			Secure:   true,
			Path:     "/",
			MaxAge:   604800 * 4, // 28 days
			SameSite: http.SameSiteStrictMode,
		})

		http.SetCookie(res, &http.Cookie{
			Name:     "X-GatorPool-Bearer",
			Value:    *token,
			HttpOnly: true,
			Secure:   true,
			Path:     "/",
			MaxAge:   3600 * 24, // 24 hours
			SameSite: http.SameSiteStrictMode,
		})

		return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
			"success": true,
			"message": "session issued",
			"onboarding_redirect": redirectToOnboarding,
		})

	} else {
		return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
			"access_token":  *token,
			"token_type":    "bearer",
			"refresh_token": *refreshToken,
			"onboarding_redirect": redirectToOnboarding,
		})
	}
}

func OAuthTwoFactorAuthentication(req *http.Request, body *OAuthBody, account *accountEntities.AccountEntity, ctx context.Context) error {

	accountsMFACollection := datastores.GetMongoDatabase(ctx).Collection(datastores.AccountsMFA)

	mfaQuery := bson.D{{Key: "user_uuid", Value: *account.UserUUID}}
	var mfa *accountEntities.MFAEntity
	err := accountsMFACollection.FindOne(ctx, mfaQuery).Decode(&mfa)
	if err != nil {
		if err != mongo.ErrNoDocuments {
			return err
		}
	}

	if mfa == nil {
		code, _ := util.Generate6DigitCode()

		mfa = &accountEntities.MFAEntity{
			ID:           primitive.NewObjectID(),
			UserUUID:     account.UserUUID,
			Email:        account.Email,
			DeviceID:     ptr.String(req.Header.Get("X-GatorPool-Device-Id")),
			Code:         code,
			AttemptsLeft: ptr.Int64(3),
			ExpiresAt:    ptr.Time(time.Now().Add(time.Minute * 5)),
			CreatedAt:    ptr.Time(time.Now()),
		}

		_, err = accountsMFACollection.InsertOne(ctx, mfa)
		if err != nil {
			return err
		}

		// Make code a string
		strCode := strconv.Itoa(int(*code))

		message := "Subject: GatorPool MFA Code\n\nYou have requested to sign in. Your code is " + strCode + ". This code will expire in 5 minutes."

		auth := smtp.PlainAuth(
			"",
			"ufgatorpool@gmail.com",
			secrets.EmailSecretValue,
			"smtp.gmail.com",
		)

		err = smtp.SendMail(
			"smtp.gmail.com:587",
			auth,
			"ufgatorpool@gmail.com",
			[]string{req.Header.Get("X-GatorPool-Username")},
			[]byte(message),
		)

		if err != nil {
			return err
		}

		return errors.New("mfa_required")
	} else {

		if body.MFACode == nil {
			return errors.New("mfa_code_required")
		}

		if mfa.ExpiresAt.Before(time.Now()) {
			// Delete the MFA
			_, err = accountsMFACollection.DeleteOne(ctx, mfaQuery)
			if err != nil {
				return err
			}
			return errors.New("mfa_expired")
		}

		if *mfa.AttemptsLeft == 0 {
			_, err = accountsMFACollection.DeleteOne(ctx, mfaQuery)
			if err != nil {
				return err
			}

			return errors.New("mfa_attempts_exceeded")
		}

		numberCode, _ := strconv.Atoi(*body.MFACode)

		if *mfa.Code != int64(numberCode) {

			*mfa.AttemptsLeft--
			_, err = accountsMFACollection.UpdateOne(ctx, mfaQuery, bson.D{{Key: "$set", Value: bson.D{{Key: "attempts_left", Value: *mfa.AttemptsLeft}}}})
			if err != nil {
				return err
			}

			return errors.New("Invalid mfa code. You have " + strconv.Itoa(int(*mfa.AttemptsLeft)) + " attempts left.")
		}

		_, err = accountsMFACollection.DeleteOne(ctx, mfaQuery)
		if err != nil {
			return err
		}

		return nil
	}
}