package handler

import (
	"context"
	"net/http"
	"fmt"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"go.mongodb.org/mongo-driver/bson"
)

func ToggleTwoFA(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Get the account object from context
	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	account.TwoFAEnabled = ptr.Bool(!*account.TwoFAEnabled)

	db := datastores.GetMongoDatabase(ctx)
	accountsCollection := db.Collection(datastores.Accounts)
	accountQuery := bson.D{{Key: "user_uuid", Value: account.UserUUID}}
	update := bson.D{{Key: "$set", Value: bson.D{{Key: "two_fa_enabled", Value: account.TwoFAEnabled}}}}
	_, err := accountsCollection.UpdateOne(ctx, accountQuery, update)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"two_fa_enabled": *account.TwoFAEnabled,
	})
}