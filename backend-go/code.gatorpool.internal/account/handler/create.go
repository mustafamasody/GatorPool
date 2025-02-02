package handler

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"regexp"
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

// MARK: VerifyAccount
func VerifyAccount(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	id := req.URL.Query().Get("id")
	signature := req.URL.Query().Get("signature")

	fmt.Println("1 ID: ", id)
	fmt.Println("1 Signature: ", signature)

	db := datastores.GetMongoDatabase(ctx)

	if id == "" || signature == "" {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"message": "Invalid request"})
	}

	verificationCollection := db.Collection(datastores.AccountsCreationVerification)

	var verification accountEntities.VerificationEntity
	// Cast id to ObjectID
	objectID, objectIDErr := primitive.ObjectIDFromHex(id)
	if objectIDErr != nil {
		return util.JSONResponse(res, 500, map[string]interface{}{
			"error": "Internal server error",
		})
	}
	verificationFilter := bson.D{
		{Key: "_id", Value: objectID},
	}
	err := verificationCollection.FindOne(ctx, verificationFilter).Decode(&verification)
	if err != nil {
		return util.JSONResponse(res, 404, map[string]interface{}{
			"error": "Verification not found",
		})
	}

	// Decrypt the signature
	emailVerificationData := encryption.EmailVerificationData{
		EncryptedEmail:    *verification.EncryptedFields.Email,
		EncryptedObjectID: *verification.EncryptedFields.ObjectID,
		EncryptedCode:     *verification.EncryptedFields.Code,
	}

	decryptErr := encryption.DecryptEmailVerificationData(&emailVerificationData)
	if decryptErr != nil {
		return util.JSONResponse(res, 500, map[string]interface{}{
			"error": "Internal server error",
		})
	}

	// Check if decrypted code matches the verification code
	decryptedCode := emailVerificationData.Code
	if decryptedCode != strconv.FormatInt(*verification.Code, 10) {
		return util.JSONResponse(res, 400, map[string]interface{}{
			"error": "Verification code does not match",
		})
	}

	if !*verification.IsVerified {
		update := bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "is_verified", Value: true},
			}},
		}
		_, updateErr := verificationCollection.UpdateOne(ctx, verificationFilter, update)
		if updateErr != nil {
			return util.JSONResponse(res, 500, map[string]interface{}{
				"error": "Internal server error",
			})
		}
	}

	var account accountEntities.AccountEntity
	accountsCollection := db.Collection(datastores.Accounts)
	accountFilter := bson.D{
		{Key: "email", Value: *verification.Info},
	}
	err = accountsCollection.FindOne(ctx, accountFilter).Decode(&account)
	if err != nil {
		return util.JSONResponse(res, 404, map[string]interface{}{
			"error": "Account not found",
		})
	}

	update := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "is_verified", Value: true},
		}},
	}
	_, updateErr := accountsCollection.UpdateOne(ctx, accountFilter, update)
	if updateErr != nil {
		return util.JSONResponse(res, 500, map[string]interface{}{
			"error": "Internal server error",
		})
	}

	// set header email
	req.Header.Set("X-GatorPool-Username", *verification.Info)

	return util.JSONResponse(res, 200, map[string]interface{}{
		"success":      true,
		"message":      "Account verified",
		"tt_from":      &verification.Info,
	})
}

// MARK: ResendVerificationEmail
func ResendVerificationEmail(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Check if headers are missing
	if req.Header.Get("X-GatorPool-Username") == "" || req.Header.Get("X-GatorPool-Device-Id") == "" {
		return util.JSONResponse(res, 400, map[string]interface{}{
			"error": "Missing headers",
		})
	}

	deviceID := req.Header.Get("X-GatorPool-Device-Id")
	email := req.Header.Get("X-GatorPool-Username")
	email = strings.ToLower(email)

	database := datastores.GetMongoDatabase(ctx)
	accountsCollection := database.Collection(datastores.Accounts)
	verificationCollection := database.Collection(datastores.AccountsCreationVerification)

	filter := bson.D{{Key: "email", Value: email}}

	var account accountEntities.AccountEntity
	err := accountsCollection.FindOne(ctx, filter).Decode(&account)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return util.JSONResponse(res, 404, map[string]interface{}{
				"error": "Account does not exist",
			})
		}
		return util.JSONResponse(res, 404, map[string]interface{}{
			"error": "Internal server error",
		})
	}

	// Check if the account is complete & verified
	if *account.IsComplete || *account.IsVerified {
		return util.JSONResponse(res, 404, map[string]interface{}{
			"error": "Account is already complete or verified",
		})
	}

	var verification accountEntities.VerificationEntity
	verificationFilter := bson.D{
		{Key: "info", Value: email},
		{Key: "device_id", Value: deviceID},
	}

	verificationErr := verificationCollection.FindOne(ctx, verificationFilter).Decode(&verification)
	if verificationErr != nil && verificationErr != mongo.ErrNoDocuments {
		return util.JSONResponse(res, 500, map[string]interface{}{

			"error": "Internal server error",
		})
	}

	if verificationErr == nil {
		if *verification.Resends >= 3 {
			return util.JSONResponse(res, 400, map[string]interface{}{
				"error":   "Max resends reached",
				"message": "MAX_RESENDS_REACHED",
			})
		} else {
			*verification.Resends = *verification.Resends + 1
			_, updateErr := verificationCollection.UpdateOne(ctx, verificationFilter, bson.D{
				{Key: "$set", Value: bson.D{
					{Key: "resends", Value: *verification.Resends},
				}},
			})
			if updateErr != nil {
				return util.JSONResponse(res, 500, map[string]interface{}{
					"error": "Internal server error",
				})
			}
		}
	} else {
		// Generate a 6 digit code
		code, codeErr := util.Generate6DigitCode()
		if codeErr != nil {
			return util.JSONResponse(res, 500, map[string]interface{}{

				"error": "Internal server error",
			})
		}

		newVerificationObject := &accountEntities.VerificationEntity{
			ID:             primitive.NewObjectID(),
			DeviceID:       ptr.String(deviceID),
			Code:           code,
			Info:           ptr.String(email),
			CreatedAt:      ptr.Time(time.Now()),
			Attempts:       ptr.Int32(0),
			Resends:        ptr.Int32(0),
			IsComplete:     ptr.Bool(false),
			IsVerified:     ptr.Bool(false),
			UUID:           account.UserUUID,
			EncryptedFields: &accountEntities.EncryptedFieldCache{
				Email:    nil,
				ObjectID: nil,
				Code:     nil,
			},
		}

		_, insertErr := verificationCollection.InsertOne(ctx, newVerificationObject)
		if insertErr != nil {
			return util.JSONResponse(res, 500, map[string]interface{}{

				"error": "Internal server error",
			})
		}

		stringCode := strconv.FormatInt(*code, 10)
		stringObjectID := newVerificationObject.ID.String()
		stringObjectID = stringObjectID[10 : len(stringObjectID)-2]

		// Email verification the code and email
		emailVerificationData := encryption.EmailVerificationData{
			Email:    email,
			Code:     stringCode,
			ObjectID: stringObjectID,
		}

		encryptErr := encryption.EncryptEmailVerificationData(&emailVerificationData)
		if encryptErr != nil {
			return util.JSONResponse(res, 500, map[string]interface{}{

				"error": "Internal server error",
			})
		}

		// Set the encrypted field cache in the verification object
		encryptedFieldCache := &accountEntities.EncryptedFieldCache{
			Email:    &emailVerificationData.EncryptedEmail,
			ObjectID: &emailVerificationData.EncryptedObjectID,
			Code:     &emailVerificationData.EncryptedCode,
		}
		update := bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "encrypted_fields", Value: encryptedFieldCache},
			}},
		}
		_, updateErr := verificationCollection.UpdateOne(ctx, verificationFilter, update)
		if updateErr != nil {
			return util.JSONResponse(res, 500, map[string]interface{}{

				"error": "Internal server error",
			})
		}

		link := ""
		if os.Getenv("ENV") == "development" {
			link = "http://localhost:3000/verify?id=" + stringObjectID + "&signature=" + emailVerificationData.EncryptedCode
		} else {
			link = "https://gatorpool.netlify.app/verify?id=" + stringObjectID + "&signature=" + emailVerificationData.EncryptedCode
		}

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
			return util.JSONResponse(res, 500, map[string]interface{}{

				"error": "Internal server error",
			})
		}
	}

	// Set the result headers:
	res.Header().Set("X-GatorPool-Device-Id", req.Header.Get("X-GatorPool-Device-Id"))
	res.Header().Set("X-GatorPool-Username", req.Header.Get("X-GatorPool-Username"))

	return util.JSONResponse(res, 200, map[string]interface{}{
		"success":      true,
		"message":      "Verification email sent",
	})
}
func FinishAccountV2(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	email := req.Header.Get("X-GatorPool-Username")
	deviceID := req.Header.Get("X-GatorPool-Device-Id")

	if email == "" || deviceID == "" {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "invalid request"})
	}

	email = strings.ToLower(email)

	body, err := requesthydrator.ParseJSONBody(req, []string{"first_name", "last_name", "ttid"})
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}

	firstName := body["first_name"].(string)
	lastName := body["last_name"].(string)
	ufid := body["ufid"].(string)

	if firstName == "" || lastName == "" || ufid == "" {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "invalid request"})
	}

	// Validate the ufid and make sure its an 8 digit number like 36157338
	reg := regexp.MustCompile(`^\d{8}$`)
	if !reg.MatchString(ufid) {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "invalid ufid"})
	}

	db := datastores.GetMongoDatabase(ctx)

	accountsCollection := db.Collection(datastores.Accounts)
	verificationCollection := db.Collection(datastores.AccountsCreationVerification)

	var account accountEntities.AccountEntity
	accountQuery := bson.D{{Key: "email", Value: email}}
	err = accountsCollection.FindOne(ctx, accountQuery).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"message": "Account not found"})
		} else {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": "internal server error"})
		}
	}

	var verification accountEntities.VerificationEntity
	verificationQuery := bson.D{{Key: "info", Value: email}}
	err = verificationCollection.FindOne(ctx, verificationQuery).Decode(&verification)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"message": "Verification not found"})
		} else {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": "internal server error"})
		}
	}

	account.FirstName = &firstName
	account.LastName = &lastName

	account.UFID = &ufid

	account.IsComplete = ptr.Bool(true)
	account.IsVerified = ptr.Bool(true)

	account.OnboardingStatus = &accountEntities.OnboardingStatus{
		State:     ptr.String("onboarding"),
		Step:      ptr.Int64(0),
		Responses: map[string]interface{}{},
	}

	_, err = accountsCollection.UpdateOne(ctx, accountQuery, bson.D{{Key: "$set", Value: account}})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": "internal server error"})
	}

	_, err = verificationCollection.DeleteOne(ctx, verificationQuery)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": "internal server error"})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "account completed",
	})
}