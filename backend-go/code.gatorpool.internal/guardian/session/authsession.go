package session

import (
	"context"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	accountModel "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"

	"code.gatorpool.internal/guardian/secrets"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"

	"go.mongodb.org/mongo-driver/bson"

	"github.com/charmbracelet/log"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/mongo"
)

// Token, TokenID, RefreshToken, TokenVersion, RefreshTokenVersion, Error
func GenerateOAuth2Token(req *http.Request, res http.ResponseWriter, ctx context.Context) (*string, *string, *string, *int32, *int32, error) {
	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    true,                  // Report the file name and line number
		ReportTimestamp: true,                  // Report the timestamp
		TimeFormat:      "2006-01-02 15:04:05", // Set the time format
		Prefix:          "AUTH SESSION (IT)",   // Set the prefix
	})

	deviceID := req.Header.Get("X-GatorPool-Device-Id")
	userAgent := req.Header.Get("User-Agent")
	email := req.Header.Get("X-GatorPool-Username")
	email = strings.ToLower(email)

	if deviceID == "" || userAgent == "" || email == "" {
		return nil, nil, nil, nil, nil, errors.New("missing required headers")
	}

	var account accountModel.AccountEntity
	accountsCollection := datastores.GetMongoDatabase(ctx).Collection("accounts")

	filter := bson.D{{Key: "email", Value: email}}
	err := accountsCollection.FindOne(ctx, filter).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments && !util.ContainsString(req.URL.Path, "/exists") {
			return nil, nil, nil, nil, nil, errors.New("account not found")
		} else if err != mongo.ErrNoDocuments && !util.ContainsString(req.URL.Path, "/exists") {
			logger.Error("Internal server error 1 : " + err.Error())
			return nil, nil, nil, nil, nil, errors.New("account not found")
		}
	}

	privateKeyLatestVersion := secrets.PrivateKeyValueLatestVersion

	// Get the latest private key and version
	privateKey, exists := secrets.GetPrivateKeyWithVersion(secrets.PrivateKeyValueLatestVersion)
	if !exists {
		return nil, nil, nil, nil, nil, errors.New("private key not found")
	}

	// Generate a new token
	audience := []string{"v1"}

	accessToken, tokenID, err := GenerateToken(deviceID, &account, privateKey, req.Header.Get("X-GatorPool-Username"), audience)
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}

	// Generate refresh token
	refreshToken := make([]byte, 32)
	_, err = rand.Read(refreshToken)
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	refreshTokenString := fmt.Sprintf("%x", refreshToken)

	if account.UserUUID != nil {

		var found bool

		// Get the sessions
		sessions := account.Sessions
		// Loop through the sessions and see if any of the VerifiedDevices match the deviceID
		for _, session := range sessions {
			if *session.DeviceUUID == deviceID {
				found = true
				// Update the session
				session.LastLoginAt = ptr.Time(time.Now())
				session.IssuedAt = ptr.Time(time.Now())
				session.RefreshToken = &refreshTokenString
				session.RefreshIssuedAt = ptr.Time(time.Now())
				session.Token = &accessToken
				session.TokenID = &tokenID
				session.EncryptedVersions = &accountModel.EncryptedVersions{
					SymmetricVersion:  ptr.Int64(int64(privateKeyLatestVersion)),
					AsymmetricVersion: ptr.Int64(int64(privateKeyLatestVersion)),
				}

				// Update the account
				account.Sessions = sessions
			}
		}

		if !found {

			// Create a new session
			session := &accountModel.Session{
				DeviceUUID:      &deviceID,
				Token:           &accessToken,
				TokenID:         &tokenID,
				IssuedAt:        ptr.Time(time.Now()),
				UserAgent:       &userAgent,
				LastLoginAt:     ptr.Time(time.Now()),
				IPAddress:       ptr.String(getIP(req)),
				RefreshToken:    &refreshTokenString,
				RefreshIssuedAt: ptr.Time(time.Now()),
				Web:             ptr.Bool(true),
				EncryptedVersions: &accountModel.EncryptedVersions{
					SymmetricVersion:  ptr.Int64(int64(privateKeyLatestVersion)),
					AsymmetricVersion: ptr.Int64(int64(privateKeyLatestVersion)),
				},
			}

			// Append the session to the account
			account.Sessions = append(account.Sessions, session)

		} else {

			for i, session := range account.Sessions {
				if *session.DeviceUUID == deviceID {
					account.Sessions[i].Token = &accessToken
					account.Sessions[i].LastLoginAt = ptr.Time(time.Now())
					account.Sessions[i].RefreshToken = &refreshTokenString
					account.Sessions[i].RefreshIssuedAt = ptr.Time(time.Now())
					account.Sessions[i].TokenID = &tokenID
					account.Sessions[i].EncryptedVersions = &accountModel.EncryptedVersions{
						SymmetricVersion:  ptr.Int64(int64(privateKeyLatestVersion)),
						AsymmetricVersion: ptr.Int64(int64(privateKeyLatestVersion)),
					}
					break
				}
			}
		}

		account.LastLogin = ptr.Time(time.Now())

		// Update the account
		_, err = accountsCollection.UpdateOne(ctx, filter, bson.D{{Key: "$set", Value: account}})
		if err != nil {
			logger.Error("Internal server error 2 : " + err.Error())
			return nil, nil, nil, nil, nil, errors.New("internal server error")
		}
	}

	return &accessToken, &tokenID, &refreshTokenString, ptr.Int32(int32(privateKeyLatestVersion)), ptr.Int32(int32(privateKeyLatestVersion)), nil
}

// Access token, Refresh token, Token ID, Token Version, Refresh Token Version, Error
func RefreshOAuth2Token(scope string, req *http.Request, res http.ResponseWriter, refreshToken *string) (*string, *string, *string, *int32, *int32, error) {
	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    true,                  // Report the file name and line number
		ReportTimestamp: true,                  // Report the timestamp
		TimeFormat:      "2006-01-02 15:04:05", // Set the time format
		Prefix:          "AUTH SESSION (IT)",   // Set the prefix
	})

	deviceID := req.Header.Get("X-GatorPool-Device-Id")
	userAgent := req.Header.Get("User-Agent")
	email := req.Header.Get("X-GatorPool-Username")
	email = strings.ToLower(email)

	if deviceID == "" || userAgent == "" || email == "" {
		return nil, nil, nil, nil, nil, errors.New("missing required headers")
	}

	var account accountModel.AccountEntity
	accountsCollection := datastores.GetMongoDatabase(context.Background()).Collection(datastores.Accounts)

	filter := bson.D{{Key: "email", Value: email}}
	err := accountsCollection.FindOne(context.Background(), filter).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments && !util.ContainsString(req.URL.Path, "/exists") {
			return nil, nil, nil, nil, nil, errors.New("account not found")
		} else if err != mongo.ErrNoDocuments && !util.ContainsString(req.URL.Path, "/exists") {
			logger.Error("Internal server error 1 : " + err.Error())
			return nil, nil, nil, nil, nil, errors.New("account not found")
		}
	}

	privateKeyLatestVersion := secrets.PrivateKeyValueLatestVersion

	// Find the verified device
	sessions := account.Sessions
	var found bool
	var foundSession accountModel.Session

	for _, session := range sessions {
		if *session.DeviceUUID == deviceID {
			found = true
			foundSession = *session
		}
	}

	if !found {
		logger.Error("No session found for the following account: ", email)
		return nil, nil, nil, nil, nil, errors.New("no session found for the following account: " + email)
	}

	// Check if the refresh token is valid
	if *foundSession.RefreshToken != *refreshToken {
		logger.Error("Invalid refresh token for the following account: ", email)
		return nil, nil, nil, nil, nil, errors.New("invalid refresh token for the following account: " + email)
	}

	accessToken, tokenID, newRefreshTokenString, _, _, err := GenerateOAuth2Token(req, res, context.Background())

	if err != nil {
		return nil, nil, nil, nil, nil, err
	}

	return accessToken, newRefreshTokenString, tokenID, ptr.Int32(int32(privateKeyLatestVersion)), ptr.Int32(int32(privateKeyLatestVersion)), nil
}

func RevokeOAuth2Token(req *http.Request, res http.ResponseWriter, ctx context.Context) error {
	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    true,                  // Report the file name and line number
		ReportTimestamp: true,                  // Report the timestamp
		TimeFormat:      "2006-01-02 15:04:05", // Set the time format
		Prefix:          "AUTH SESSION (RT)",   // Set the prefix
	})

	deviceID := req.Header.Get("X-GatorPool-Device-Id")
	email := req.Header.Get("X-GatorPool-Username")
	email = strings.ToLower(email)

	if deviceID == "" || email == "" {
		return errors.New("missing required headers")
	}

	var account accountModel.AccountEntity
	accountsCollection := datastores.GetMongoDatabase(context.Background()).Collection(datastores.Accounts)

	filter := bson.D{{Key: "email", Value: email}}
	err := accountsCollection.FindOne(context.Background(), filter).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments && !util.ContainsString(req.URL.Path, "/exists") {
			return errors.New("account not found")
		} else if err != mongo.ErrNoDocuments && !util.ContainsString(req.URL.Path, "/exists") {
			logger.Error("Internal server error 1 : " + err.Error())
			return errors.New("account not found")
		}
	}

	// Find the verified device
	sessions := account.Sessions
	var found bool
	var foundSession accountModel.Session

	for _, session := range sessions {
		if *session.DeviceUUID == deviceID {
			found = true
			foundSession = *session
		}
	}

	if !found {
		logger.Error("No session found for the following account: ", email)
		return errors.New("no session found for the following account: " + email)
	}

	foundSession.Token = nil
	foundSession.RefreshToken = nil
	foundSession.RefreshIssuedAt = nil
	foundSession.TokenID = nil
	foundSession.LastLoginAt = nil
	foundSession.EncryptedVersions = &accountModel.EncryptedVersions{
		SymmetricVersion:  ptr.Int64(0),
		AsymmetricVersion: ptr.Int64(0),
	}

	// Set the session
	for i, session := range sessions {
		if *session.DeviceUUID == deviceID {
			sessions[i] = &foundSession
		}
	}

	// Update the account
	account.Sessions = sessions

	// Update the account in MongoDB
	_, err = accountsCollection.UpdateOne(context.Background(), filter, bson.D{{Key: "$set", Value: account}})
	if err != nil {
		logger.Error("Error updating account: ", err)
		return err
	}

	return nil
}

// MARK: VerifyToken
func VerifyOAuthToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		err := VerifyOAuthTokenInternal(req, res, req.Context())
		if err != nil {
			util.JSONResponse(res, 401, map[string]interface{}{
				"error": err.Error(),
			})
			return
		}
		next.ServeHTTP(res, req) // Call the next handler if token verification is successful
	})
}

// MARK: VerifyOAuthTokenInternal
func VerifyOAuthTokenInternal(req *http.Request, res http.ResponseWriter, ctx context.Context) error {

	// Set the logger
	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    true,                  // Report the file name and line number
		ReportTimestamp: true,                  // Report the timestamp
		TimeFormat:      "2006-01-02 15:04:05", // Set the time format
		Prefix:          "AUTH SESSION (VTI)",  // Set the prefix
	})

	// Get headers 'X-GatorPool-Username' and 'X-GatorPool-Device-Id'
	gpFrom := req.Header.Get("X-GatorPool-Username")
	gpDeviceID := req.Header.Get("X-GatorPool-Device-Id")

	// Check if 'X-GatorPool-Username' and 'X-GatorPool-Device-Id' are empty
	if gpFrom == "" || gpDeviceID == "" {
		logger.Error("X-GatorPool-Username or X-GatorPool-Device-Id or token is empty")
		return errors.New("X-GatorPool-Username or X-GatorPool-Device-Id or token is empty")
	}

	// Get the token cookie, if it doesnt exist, get the header
	token := ""
	for _, cookie := range req.Cookies() {
		if cookie.Name == "X-GatorPool-Bearer" {
			token = cookie.Value
			break
		}
	}

	if token == "" {
		token = req.Header.Get("X-GatorPool-Bearer")
	}

	if token == "" {
		logger.Error("Token is empty")
		return errors.New("token is empty")
	}

	var account accountModel.AccountEntity
	accountsCollection := datastores.GetMongoDatabase(ctx).Collection("accounts")

	// Check if the account exists with the given email
	filter := bson.D{{Key: "email", Value: gpFrom}}
	err := accountsCollection.FindOne(ctx, filter).Decode(&account)
	if err != nil { // Throw an error if the account does not exist
		// Check if error is no account found
		if err == mongo.ErrNoDocuments {
			return errors.New("no account found with the following email: " + gpFrom)
		}
		logger.Error("Error finding account 1: ", err)
		return errors.New("error finding account 1")
	}

	sessions := account.Sessions
	var found bool
	var foundSession accountModel.Session

	// Loop through the sessions and see if any of the VerifiedDevices match the deviceID
	for _, session := range sessions {
		if *session.DeviceUUID == gpDeviceID {
			found = true
			foundSession = *session
		}
	}

	if !found {
		logger.Error("No session found for the following account: ", gpFrom)
		logger.Error("deviceID: ", gpDeviceID)
		return errors.New("no session found for the following account: " + gpFrom)
	}

	// Check if the tokens match
	if *foundSession.Token != token {
		logger.Error("Invalid token for the following account: ", gpFrom)
		return errors.New("invalid token for the following account: " + gpFrom)
	}

	// Set jwtid & jwtversion
	jwtid := foundSession.TokenID
	_ = jwtid
	jwtversion := foundSession.EncryptedVersions.AsymmetricVersion
	publicversion := foundSession.EncryptedVersions.SymmetricVersion
	_ = jwtversion
	_ = publicversion

	audience := []string{"v1"}

	// Get public key
	publicKey, retrieved := secrets.GetPublicKeyWithVersion(int32(*publicversion))
	if !retrieved {
		logger.Error("Error retrieving public key, version does not exist")
		return errors.New("error retrieving public key, version does not exist")
	}

	// Parse the public key
	block, _ := pem.Decode([]byte(publicKey))
	if block == nil {
		logger.Error("Error: no PEM data found")
		return errors.New("no PEM data found")
	}
	rsaPublicKey, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		logger.Error("Error parsing public key: ", err)
		return errors.New("error parsing public key")
	}

	// Verify token signature
	tokenVerify, err := jwt.Parse(*foundSession.Token, func(token *jwt.Token) (interface{}, error) {
		return rsaPublicKey, nil
	})
	_ = tokenVerify

	if err != nil {
		if err == jwt.ErrTokenExpired {
			logger.Error("Session expired for the following account: ", gpFrom)
			return errors.New("session expired for the following account: " + gpFrom)
		} else if err == jwt.ErrSignatureInvalid {
			logger.Error("Invalid token for the following account: ", gpFrom)
			return errors.New("invalid token for the following account: " + gpFrom)
		} else {
			logger.Error("Error verifying token: ", err)
			return errors.New("error verifying token: " + err.Error())
		}
	}

	claims := tokenVerify.Claims.(jwt.MapClaims)

	expirationTime := int64(claims["exp"].(float64))

	// Check if the token has expired
	if time.Now().Unix() > expirationTime {
		logger.Error("Session expired for the following account: ", gpFrom)
		return errors.New("session expired for the following account: " + gpFrom)
	}

	// Check if audience matches
	if !util.Contains(audience, claims["aud"].(string)) {
		logger.Error("Invalid audience for the following account: ", gpFrom)
		return errors.New("invalid audience for the following account: " + gpFrom)
	}

	go updateLastLoginAt(account, sessions, foundSession) // Asynchronous session update

	return nil
}

func updateLastLoginAt(account accountModel.AccountEntity, sessions []*accountModel.Session, foundSession accountModel.Session) {
	// Perform the session update asynchronously after returning the response
	foundSession.LastLoginAt = ptr.Time(time.Now())
	_ = foundSession.LastLoginAt
	account.Sessions = sessions

	// Update the account in MongoDB
	accountsCollection := datastores.GetMongoDatabase(context.Background()).Collection("accounts")
	filter := bson.D{{Key: "email", Value: account.Email}}
	_, err := accountsCollection.UpdateOne(context.Background(), filter, bson.D{{Key: "$set", Value: account}})
	if err != nil {
		fmt.Println("Error updating account: ", err)
	}
}

// MARK: GenerateToken
func GenerateToken(deviceID string, account *accountModel.AccountEntity, privateKey string, username string, audience []string) (string, string, error) {

	// Generate token ID (8 digits)
	tokenID := make([]byte, 8)
	_, err := rand.Read(tokenID)
	if err != nil {
		return "", "", err
	}

	// Convert token ID to string
	tokenIDString := fmt.Sprintf("%x", tokenID)

	// Parse the private key
	block, _ := pem.Decode([]byte(privateKey))
	if block == nil {
		return "", "", errors.New("error decoding private key")
	}

	// Parse the private key
	privateKeyParsed, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return "", "", err
	}

	// Generate a new token
	token := jwt.New(jwt.SigningMethodRS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["aud"] = audience
	claims["sub"] = username
	claims["user_uuid"] = *account.UserUUID
	claims["device_id"] = deviceID

	// Set expiration to 24 hours from now
	claims["exp"] = time.Now().Add(24 * time.Hour).Unix() // Expiration time as a Unix timestamp
	// claims["exp"] = time.Now().Add(1 * time.Minute).Unix() // Expiration time as a Unix timestamp
	claims["iat"] = time.Now().Unix()                     // Issued at timestamp
	claims["jti"] = tokenIDString                         // Unique token ID

	// Sign the token
	tokenString, err := token.SignedString(privateKeyParsed)
	if err != nil {
		return "", "", err
	}

	return tokenString, tokenIDString, nil
}

func getIP(r *http.Request) string {
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return ""
	}
	return ip
}