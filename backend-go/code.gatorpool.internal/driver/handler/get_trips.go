package handler

import (
	"context"
	"fmt"
	"net/http"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"go.mongodb.org/mongo-driver/bson"
)

func GetPastTripsSummary(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Get the account object from context
	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	db := datastores.GetMongoDatabase(ctx)
	tripsCollection := db.Collection(datastores.Trips)

	// Get all trips for the driver
	var trips []*tripEntities.TripEntity
	cursor, err := tripsCollection.Find(ctx, bson.M{"assigned_driver.user_uuid": *account.UserUUID})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var trip tripEntities.TripEntity
		if err := cursor.Decode(&trip); err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}
		trips = append(trips, &trip)
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"trips": trips,
		"success": true,
	})
}
