package handler

import (
	"context"
	"fmt"
	"net/http"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"github.com/go-chi/chi"
	"go.mongodb.org/mongo-driver/bson"
)

func GetIndividualTrip(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Get the account object from context
	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	tripUUID := chi.URLParam(req, "trip_uuid")

	db := datastores.GetMongoDatabase(ctx)
	tripsCollection := db.Collection(datastores.Trips)

	// Get all trips for the driver
	var trip *tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.D{
		{Key: "trip_uuid", Value: tripUUID},
		{Key: "riders.user_uuid", Value: *account.UserUUID},
	}).Decode(&trip)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"trip": trip,
		"success": true,
		"userUUID": *account.UserUUID,
	})
}
