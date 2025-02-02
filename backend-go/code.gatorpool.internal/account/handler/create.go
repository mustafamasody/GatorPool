package handler

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	"code.gatorpool.internal/account/validator"
	datastores "code.gatorpool.internal/datastores/mongo"
	"code.gatorpool.internal/guardian/encryption"
	passwords "code.gatorpool.internal/guardian/password"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"code.gatorpool.internal/util/requesthydrator"
	"github.com/pborman/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func SignUpV1(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	deviceID := req.Header.Get("X-GatorPool-Device-Id")
	email := req.Header.Get("X-GatorPool-Username")

	if !*validator.ValidateInitializeSignUpRequest(req) {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{ "error": "invalid_request" })
	}

	email = strings.ToLower(email)

	body, err := requesthydrator.ParseJSONBody(req, []string{"password"})
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{ "error": "invalid_request" })
	}

	password := body["password"].(string)

	if password == "" {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{ "error": "invalid_request" })
	}

	if !*passwords.ValidatePassword(&password) {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{ "error": "invalid_password" })
	}

	db := datastores.GetMongoDatabase(ctx)

	accountsCollection := db.Collection(datastores.Accounts)
	// verificationCollection := db.Collection(datastores.AccountsCreationVerification)

	accountQuery := bson.D{{Key: "email", Value: email}}
	var account *accountEntities.AccountEntity
	err = accountsCollection.FindOne(ctx, accountQuery).Decode(&account)
	if err == nil {
		if !*account.IsComplete && *account.IsVerified {
			return util.JSONResponse(res, http.StatusPreconditionFailed, map[string]interface{}{
				"error": "already_have_account",
			})
		} else {
			return util.JSONResponse(res, http.StatusConflict, map[string]interface{}{
				"error": "account_exists",
			})
		}
	}

	if err != mongo.ErrNoDocuments {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "internal_error",
		})
	}

	accountUUID := uuid.NewRandom().String()

	hash, version, err := passwords.HashPassword(&password)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "internal_error",
		})
	}

	account = &accountEntities.AccountEntity{
		ID: primitive.NewObjectID(),
		IsVerified: ptr.Bool(false),
		IsComplete: ptr.Bool(false),
		UserUUID: &accountUUID,
		Email: &email,
		CreatedAt: ptr.Time(time.Now()),
		UpdatedAt: ptr.Time(time.Now()),
		Sessions: []*accountEntities.Session{},
		LastLogin: ptr.Time(time.Now()),
		LastLogout: ptr.Time(time.Now()),
		FirstName: nil,
		LastName: nil,
		UFID: nil,
		Phone: nil,
		RiderUUID: nil,
		DriverUUID: nil,
		TwoFAEnabled: ptr.Bool(false),
		ProfilePicture: ptr.Bool(false),
		Password: &accountEntities.Password{
			Hash: hash,
			EncryptedVersion: version,
		},
	}

	_, err = accountsCollection.InsertOne(ctx, account)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "internal_error",
		})
	}

	var verification *accountEntities.VerificationEntity
	verificationFilter := bson.D{
		{Key: "info", Value: email},
		{Key: "device_id", Value: deviceID},
	}

	err = accountsCollection.FindOne(ctx, verificationFilter).Decode(&verification)
	if err != nil && err != mongo.ErrNoDocuments {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "internal_error",
		})
	}

	if err == nil {
		_, err = accountsCollection.DeleteOne(ctx, verificationFilter)
		if err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
				"error": "internal_error",
			})
		}
	}

	// Generate a 6 digit signature code to encrypt
	code, codeErr := util.Generate6DigitCode()
	if codeErr != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "internal_error",
		})
	}

	newVerificationObject := &accountEntities.VerificationEntity{
		ID:             primitive.NewObjectID(),
		DeviceID:       ptr.String(deviceID),
		Code:           code,
		Info:           ptr.String(email),
		CreatedAt:      ptr.Time(time.Now()),
		Attempts:       ptr.Int32(0),
		IsComplete:     ptr.Bool(false),
		IsVerified:     ptr.Bool(false),
		Resends:        ptr.Int32(0),
		UUID:           account.UserUUID,
		EncryptedFields: &accountEntities.EncryptedFieldCache{
			Email:    nil,
			ObjectID: nil,
			Code:     nil,
		},
	}

	_, err = accountsCollection.InsertOne(ctx, newVerificationObject)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "internal_error",
		})
	}

	stringCode := strconv.FormatInt(*code, 10)
	stringObjectID := newVerificationObject.ID.String()
	stringObjectID = stringObjectID[10 : len(stringObjectID)-2]

	emailVerificationData := encryption.EmailVerificationData{
		Email: email,
		Code:  stringCode,
		ObjectID:    stringObjectID,
	}

	err = encryption.EncryptEmailVerificationData(&emailVerificationData)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "internal_error",
		})
	}

	encryptedFieldCache := &accountEntities.EncryptedFieldCache{
		Email:    &emailVerificationData.Email,
		ObjectID: &emailVerificationData.ObjectID,
		Code:     &emailVerificationData.Code,
	}
	update := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "encrypted_fields", Value: encryptedFieldCache},
		}},
	}
	_, err = accountsCollection.UpdateOne(ctx, bson.D{{Key: "_id", Value: newVerificationObject.ID}}, update)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "internal_error",
		})
	}

	link := ""
	if os.Getenv("ENV") == "development" {
		link = "http://localhost:3000/verify?id=" + stringObjectID + "&signature=" + emailVerificationData.EncryptedCode
	} else {
		link = "https://gatorpool.netlify.app/verify?id=" + stringObjectID + "&signature=" + emailVerificationData.EncryptedCode
	}

	fmt.Println("Debug Link: " + link)

	emailErr := SendEmail(EmailRequestBody{
		Email:    email,
		Subject:  "GatorPool - Finish signing up",
		Template: "verify-create-account",
		Data: map[string]string{
			"EMAIL": email,
			"URL":   link,
		},
	})

	if emailErr != nil {
		fmt.Println("Internal server error: " + emailErr.Error())
		return util.JSONResponse(res, 500, map[string]interface{}{
			"error": "Internal server error",
		})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success":      true,
		"message":      "account initialized",
	})
}