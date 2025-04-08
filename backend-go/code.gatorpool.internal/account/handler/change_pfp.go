package handler

import (
	"context"
	"net/http"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	"code.gatorpool.internal/datastores/gcs"
	datastores "code.gatorpool.internal/datastores/mongo"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"

	"go.mongodb.org/mongo-driver/bson"
)

func ChangeProfilePicture(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	oauthAccount, _ := req.Context().Value("account").(accountEntities.AccountEntity)

	mediaEntities, err := gcs.Upload(req)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	db := datastores.GetMongoDatabase(ctx)
	accountsCollection := db.Collection(datastores.Accounts)

	var account accountEntities.AccountEntity
	err = accountsCollection.FindOne(ctx, bson.M{"user_uuid": oauthAccount.UserUUID}).Decode(&account)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	account.ProfilePicture = ptr.Bool(true)
	
	signedURlEntities, err := gcs.CreateSignedURL([]string{
		mediaEntities[0].FileName,
	})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}
	
	account.ProfilePictureObj = &accountEntities.ProfilePicture{
		ImageGCSPath: &signedURlEntities[0].Route,
		ImageURL: &signedURlEntities[0].SignedURL,
		ImageURLExpiryAt: ptr.Int64(time.Now().Add(time.Minute * 5).UnixMilli()),
	}

	_, err = accountsCollection.UpdateOne(ctx, bson.M{"user_uuid": account.UserUUID}, bson.M{"$set": account})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"url": signedURlEntities[0].SignedURL,
	})
}