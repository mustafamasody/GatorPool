package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"github.com/go-chi/chi"
	"go.mongodb.org/mongo-driver/bson"
)

type SaveTripSentBodyRequest struct {
	Trip *tripEntities.TripEntity `json:"trip"`
}

func SaveTripSentBody(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

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
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	if *trip.AssignedDriver.UserUUID != *account.UserUUID {
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "unauthorized",
		})
	}

	var body SaveTripSentBodyRequest
	err = json.NewDecoder(req.Body).Decode(&body)
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	trip.Fare = body.Trip.Fare

	trip.Fare.Aggregated = ptr.Float64(*trip.Fare.Food + *trip.Fare.Gas + *trip.Fare.Trip)

	trip.Miscellaneous = body.Trip.Miscellaneous
	trip.Carpool = body.Trip.Carpool

	_, err = tripsCollection.UpdateOne(ctx, bson.M{"trip_uuid": tripUUID}, bson.M{"$set": trip})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"trip": trip,
		"success": true,
	})
}
