package handler

import (
	"context"
	"net/http"
	"strings"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	"code.gatorpool.internal/account/validator"
	datastores "code.gatorpool.internal/datastores/mongo"
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

	// deviceID := req.Header.Get("X-GatorPool-Device-Id")
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

	if err != nil && err != mongo.ErrNoDocuments {
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

	return nil
}