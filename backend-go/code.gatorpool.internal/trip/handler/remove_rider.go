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

func DriverFlowRemoveRider(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)
	
	tripUUID := chi.URLParam(req, "trip_uuid")
	riderUUID := chi.URLParam(req, "rider_uuid")

	db := datastores.GetMongoDatabase(context.Background())

	tripsCollection := db.Collection(datastores.Trips)

	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		fmt.Println("Error finding trip: ", err)
	}

	if *trip.PostedBy != *account.UserUUID {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "you are not the driver of this trip",
		})
	}

	for i, rider := range trip.Riders {
		if *rider.UserUUID == riderUUID {
			trip.Riders = append(trip.Riders[:i], trip.Riders[i+1:]...)
			break
		}
	}

	_, err = tripsCollection.UpdateOne(ctx, bson.M{"trip_uuid": tripUUID}, bson.M{"$set": bson.M{"riders": trip.Riders}})
	if err != nil {
		fmt.Println("Error updating trip: ", err)
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"trip": trip,
	})	
}

func RiderFlowRemoveRequest(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)
	
	tripUUID := chi.URLParam(req, "trip_uuid")

	db := datastores.GetMongoDatabase(context.Background())

	tripsCollection := db.Collection(datastores.Trips)

	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		fmt.Println("Error finding trip: ", err)
	}

	for i, rider := range trip.Riders {
		if *rider.UserUUID == *account.UserUUID {
			trip.Riders = append(trip.Riders[:i], trip.Riders[i+1:]...)
			break
		}
	}

	_, err = tripsCollection.UpdateOne(ctx, bson.M{"trip_uuid": tripUUID}, bson.M{"$set": bson.M{"riders": trip.Riders}})
	if err != nil {
		fmt.Println("Error updating trip: ", err)
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
	})	
}