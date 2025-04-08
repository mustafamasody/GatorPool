package handler

import (
	"context"
	"net/http"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"github.com/go-chi/chi"
	"go.mongodb.org/mongo-driver/bson"
)

func RiderFlowGetDriverDetails(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)
	
	tripUUID := chi.URLParam(req, "trip_uuid")

	db := datastores.GetMongoDatabase(ctx)
	tripsCollection := db.Collection(datastores.Trips)

	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "trip not found",
		})
	}

	// if the rider is not in the trip, return an error
	found := false
	for _, rider := range trip.Riders {
		if *rider.UserUUID == *account.UserUUID {
			found = true
			break
		}
	}

	if !found {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "rider not found",
		})
	}

	driverProfile, err := GetTripArrayDriverInformation([]string{tripUUID})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error getting driver profile",
		})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"driver": driverProfile[0],
		"success": true,
	})
}