package handler

import (
	"context"
	"fmt"
	"net/http"
	// "os"
	// "regexp"
	// "strconv"
	// "strings"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	"code.gatorpool.internal/datastores/gcs"
	datastores "code.gatorpool.internal/datastores/mongo"
	// riderEntities "code.gatorpool.internal/rider/entities"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	// "code.gatorpool.internal/util/requesthydrator"
	// "github.com/pborman/uuid"
	"go.mongodb.org/mongo-driver/bson"
	// "go.mongodb.org/mongo-driver/bson/primitive"
	// "go.mongodb.org/mongo-driver/mongo"
)

func LoadIn(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Get the account object from context
	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	defaultReturn := make(map[string]interface{})
	defaultReturn["success"] = true
	defaultReturn["first_name"] = account.FirstName
	defaultReturn["last_name"] = account.LastName
	defaultReturn["email"] = account.Email
	defaultReturn["user_uuid"] = account.UserUUID
	defaultReturn["onboarding_status"] = account.OnboardingStatus

	db := datastores.GetMongoDatabase(ctx)

	accountsCollection := db.Collection(datastores.Accounts)
	accountQuery := bson.D{{Key: "user_uuid", Value: account.UserUUID}}

	if *account.ProfilePicture {

		// Image URL expiry time is 2 hours, if it's expired, generate a new signed URL
		if time.Now().UnixMilli() > *account.ProfilePictureObj.ImageURLExpiryAt {
			fmt.Println("Generating new signed URL for profile picture")

			// Format the expiry time
			timeFormat := time.UnixMilli(*account.ProfilePictureObj.ImageURLExpiryAt).Format("2006-01-02 15:04:05")
			fmt.Println("Time it expired at: ", timeFormat)
			mediaEntities, err := gcs.CreateSignedURL([]string{
				*account.ProfilePictureObj.ImageGCSPath,
			})

			if err != nil {
				return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
			}

			account.ProfilePictureObj.ImageURL = &mediaEntities[0].SignedURL
			account.ProfilePictureObj.ImageURLExpiryAt = ptr.Int64(mediaEntities[0].Date.Add(time.Minute * 20).UnixMilli())

			_, err = accountsCollection.UpdateOne(ctx, accountQuery, bson.D{{Key: "$set", Value: account}})
			if err != nil {
				return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
			}

			defaultReturn["profile_picture"] = *account.ProfilePictureObj.ImageURL
			defaultReturn["profile_picture_expiry"] = *account.ProfilePictureObj.ImageURLExpiryAt

		} else {
			defaultReturn["profile_picture"] = *account.ProfilePictureObj.ImageURL
			defaultReturn["profile_picture_expiry"] = *account.ProfilePictureObj.ImageURLExpiryAt
		}
	} else {
		defaultReturn["profile_picture"] = "https://storage.googleapis.com/gatorpool-449552.appspot.com/default_pfp.png"
		defaultReturn["profile_picture_expiry"] = time.Now().Add(time.Minute * 20).UnixMilli()
	}
		
	return util.JSONResponse(res, http.StatusOK, defaultReturn)
}