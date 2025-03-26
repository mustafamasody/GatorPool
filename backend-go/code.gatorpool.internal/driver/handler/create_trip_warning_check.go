package handler

import (
	"context"
	"fmt"
	"net/http"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	warningEntities "code.gatorpool.internal/fulfillment/entities"
	"code.gatorpool.internal/util"
	"go.mongodb.org/mongo-driver/bson"
)

func CreateTripWarningCheck(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Get the account object from context
	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	db := datastores.GetMongoDatabase(ctx)
	warningsCollection := db.Collection(datastores.Warnings)

	var warnings []*warningEntities.WarningEntity
	cursor, err := warningsCollection.Find(ctx, bson.M{"user_uuid": account.UserUUID})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}
	defer cursor.Close(ctx)

	// decode all the warnings
	if err := cursor.All(ctx, &warnings); err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	if warnings == nil {
		warnings = []*warningEntities.WarningEntity{}

		return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
			"warnings": warnings,
			"can_create_trip": true,
			"success": true,
		})
	}

	aggregatedUsablePoints := 0
	for _, warning := range warnings {
		// time check, if the warning's resolves at is in the past, then it is usable
		if (warning.ResolvesAt != nil && warning.ResolvesAt.After(time.Now())) || (warning.Resolved != nil && !*warning.Resolved) {
			aggregatedUsablePoints += *warning.Points
		}
	}

	if aggregatedUsablePoints >= 3 {
		return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
			"warnings": warnings,
			"can_create_trip": false,
			"success": true,
		})
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"warnings": warnings,
		"can_create_trip": true,
		"success": true,
	})
}
