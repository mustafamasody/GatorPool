package handler

import (
	"context"
	"net/http"
	"net/smtp"
	"strconv"
	"strings"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	passwordEntity "code.gatorpool.internal/guardian/password"
	"code.gatorpool.internal/guardian/secrets"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"code.gatorpool.internal/util/requesthydrator"
	"github.com/pborman/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func RequestPasswordReset(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	email := req.Header.Get("X-GatorPool-Username")
	email = strings.ToLower(email)

	db := datastores.GetMongoDatabase(ctx)

	accountsCollection := db.Collection(datastores.Accounts)

	accountQuery := bson.D{{Key: "email", Value: email}}
	var account accountEntities.AccountEntity
	err := accountsCollection.FindOne(ctx, accountQuery).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"error": "account not found"})
		} else {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	// Query through password reset collection
	passwordResetCollection := db.Collection(datastores.AccountsPasswordReset)

	var resets []*accountEntities.PasswordResetEntity
	passwordResetQuery := bson.D{{Key: "user_uuid", Value: *account.UserUUID}}
	cursor, err := passwordResetCollection.Find(ctx, passwordResetQuery)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}
	defer cursor.Close(ctx)
	if err = cursor.All(ctx, &resets); err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	// Check if there is an existing password reset request
	if len(resets) > 0 {
		for _, reset := range resets {
			if reset.ExpiresAt.UnixMilli() > time.Now().UnixMilli() {
				return util.JSONResponse(res, http.StatusConflict, map[string]interface{}{"error": "password reset request already exists"})
			} else {
				// Clear expired password reset requests
				_, err = passwordResetCollection.DeleteOne(ctx, bson.D{{Key: "reset_id", Value: *reset.ResetID}})
				if err != nil {
					return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
				}
			}
		}
	}

	// Create a new password reset request
	code, err := util.Generate6DigitCode()
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	passwordReset := &accountEntities.PasswordResetEntity{
		ID:           primitive.NewObjectID(),
		UserUUID:     account.UserUUID,
		ResetID:      ptr.String(uuid.NewRandom().String()),
		Code:         code,
		ExpiresAt:    ptr.Time(time.Now().Add(time.Minute * 15)),
		CreatedAt:    ptr.Time(time.Now()),
		AttemptsLeft: ptr.Int64(3),
	}

	_, err = passwordResetCollection.InsertOne(ctx, passwordReset)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	// Make code a string
	strCode := strconv.Itoa(int(*code))

	message := "Subject: Password Reset\n\nYou have requested to reset your password. Your code is " + strCode + ". This code will expire in 15 minutes."

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
		[]string{email},
		[]byte(message),
	)

	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "password reset request sent",
	})
}

func CheckCode(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {
	email := req.Header.Get("X-GatorPool-Username")
	email = strings.ToLower(email)

	db := datastores.GetMongoDatabase(ctx)

	accountsCollection := db.Collection(datastores.Accounts)

	accountQuery := bson.D{{Key: "email", Value: email}}
	var account accountEntities.AccountEntity
	err := accountsCollection.FindOne(ctx, accountQuery).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"error": "account not found"})
		} else {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	// Query through password reset collection
	passwordResetCollection := db.Collection(datastores.AccountsPasswordReset)

	var resets []*accountEntities.PasswordResetEntity
	passwordResetQuery := bson.D{{Key: "user_uuid", Value: *account.UserUUID}}
	cursor, err := passwordResetCollection.Find(ctx, passwordResetQuery)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}
	defer cursor.Close(ctx)
	if err = cursor.All(ctx, &resets); err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	// Check if there is an existing password reset request
	if len(resets) == 0 {
		return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"error": "no password reset request found"})
	}

	// Check if the request is expired
	var reset *accountEntities.PasswordResetEntity
	for _, r := range resets {
		if r.ExpiresAt.UnixMilli() > time.Now().UnixMilli() {
			reset = r
			break
		}
	}

	if reset == nil {
		return util.JSONResponse(res, http.StatusConflict, map[string]interface{}{"error": "password reset request expired"})
	}

	if reset.AttemptsLeft == nil || *reset.AttemptsLeft == 0 {

		// Delete the reset request
		_, err = passwordResetCollection.DeleteOne(ctx, bson.D{{Key: "reset_id", Value: *reset.ResetID}})
		if err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}

		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "send_back_err"})
	}

	// Check if the code is the same
	body, err := requesthydrator.ParseJSONBody(req, []string{"code"})
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}

	code, err := strconv.Atoi(body["code"].(string))
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "invalid code"})
	}

	if code != int(*reset.Code) {

		// Decrement attempts left
		reset.AttemptsLeft = ptr.Int64(*reset.AttemptsLeft - 1)
		_, err = passwordResetCollection.UpdateOne(ctx, bson.D{{Key: "reset_id", Value: *reset.ResetID}}, bson.D{{Key: "$set", Value: reset}})
		if err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}

		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "Invalid code. You have " + strconv.Itoa(int(*reset.AttemptsLeft)) + " attempts left"})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "code is valid",
	})
}

func ResetPassword(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {
	email := req.Header.Get("X-GatorPool-Username")
	email = strings.ToLower(email)

	db := datastores.GetMongoDatabase(ctx)

	accountsCollection := db.Collection(datastores.Accounts)

	accountQuery := bson.D{{Key: "email", Value: email}}
	var account accountEntities.AccountEntity
	err := accountsCollection.FindOne(ctx, accountQuery).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"error": "account not found"})
		} else {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	// Query through password reset collection
	passwordResetCollection := db.Collection(datastores.AccountsPasswordReset)

	var resets []*accountEntities.PasswordResetEntity
	passwordResetQuery := bson.D{{Key: "user_uuid", Value: *account.UserUUID}}
	cursor, err := passwordResetCollection.Find(ctx, passwordResetQuery)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}
	defer cursor.Close(ctx)
	if err = cursor.All(ctx, &resets); err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	// Check if there is an existing password reset request
	if len(resets) == 0 {
		return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"error": "no password reset request found"})
	}

	// Check if the request is expired
	var reset *accountEntities.PasswordResetEntity
	for _, r := range resets {
		if r.ExpiresAt.UnixMilli() > time.Now().UnixMilli() {
			reset = r
			break
		}
	}

	if reset == nil {
		return util.JSONResponse(res, http.StatusConflict, map[string]interface{}{"error": "password reset request expired"})
	}

	body, err := requesthydrator.ParseJSONBody(req, []string{"code", "password"})
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}

	code, err := strconv.Atoi(body["code"].(string))
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "invalid code"})
	}

	if code != int(*reset.Code) {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "invalid code"})
	}

	password := body["password"].(string)

	// Validate password
	if !*passwordEntity.ValidatePassword(&password) {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "Invalid password. Must have 1 uppercase letter, one lowercase letter, a special symbol, and at least 6 characters."})
	}

	// Update password
	hash, version, err := passwordEntity.HashPassword(&password)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	account.Password.Hash = hash
	account.Password.EncryptedVersion = ptr.Int64(int64(*version))

	_, err = accountsCollection.UpdateOne(ctx, accountQuery, bson.D{{Key: "$set", Value: account}})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	account.TwoFARequests = append(account.TwoFARequests, &accountEntities.TwoFARequest{
		RequestID:    ptr.String(uuid.NewRandom().String()),
		FlowType:     ptr.String("password_reset"),
		FlowStatus:   ptr.String("completed"),
		FlowData:     reset.ResetID,
		StateChanges: []*accountEntities.TwoFAStateChange{},
		DeleteTimer:  ptr.Bool(false),
		CreatedAt:    ptr.Time(time.Now()),
		UpdatedAt:    ptr.Time(time.Now()),
	})

	// Update account
	_, err = accountsCollection.UpdateOne(ctx, accountQuery, bson.D{{Key: "$set", Value: account}})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	// Clear password reset request
	_, err = passwordResetCollection.DeleteOne(ctx, bson.D{{Key: "reset_id", Value: *reset.ResetID}})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "password reset successful",
	})
}
