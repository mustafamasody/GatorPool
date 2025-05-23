package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	riderEntities "code.gatorpool.internal/rider/entities"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"github.com/go-chi/chi"
	"go.mongodb.org/mongo-driver/bson"
)

func RiderFlowGetDriverProfiles(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	tripUUID := chi.URLParam(req, "trip_uuid")
	flowType := req.URL.Query().Get("flow_type")
	db := datastores.GetMongoDatabase(context.Background())

	tripsCollection := db.Collection(datastores.Trips)

	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		fmt.Println("Error finding trip: ", err)
	}

	if flowType == "requests" {
		driverProfiles, err := GetTripArrayDriverRequestsInformation([]string{tripUUID})
		if err != nil {
			fmt.Println("Error getting driver profiles: ", err)
		}
	
		return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
			"success": true,
			"driverRequestsProfiles": driverProfiles,
		})
	} else if flowType == "assigned" {
		driverProfile, err := GetTripArrayDriverInformation([]string{tripUUID})
		if err != nil {
			fmt.Println("Error getting driver profile: ", err)
		}

		return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
			"success": true,
			"driver": driverProfile,
		})
	} else {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "invalid flow type",
		})
	}
}

type RiderFlowDriverRequestTripBody struct {
	FoodCost float64 `json:"food"`
	GasCost float64 `json:"gas"`
	TripCost float64 `json:"trip"`
	TotalFare float64 `json:"total"`
}

func RiderFlowDriverRequestTrip(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)
	
	rider, _ := req.Context().Value("rider").(*riderEntities.RiderEntity)
	
	tripUUID := chi.URLParam(req, "trip_uuid")

	db := datastores.GetMongoDatabase(context.Background())

	tripsCollection := db.Collection(datastores.Trips)

	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		fmt.Println("Error finding trip: ", err)
	}

	var body RiderFlowDriverRequestTripBody
	err = json.NewDecoder(req.Body).Decode(&body)
	if err != nil {
		fmt.Println("Error decoding body: ", err)
	}

	// UNCOMMENT THIS IN PRODUCTION
	
	// for _, rider := range trip.Riders {
	// 	if *rider.UserUUID == *account.UserUUID {
	// 		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
	// 			"error": "you have already requested this trip or are a rider on this trip",
	// 		})
	// 	}
	// }

	newTripDriverRequest := &tripEntities.TripDriverRequestEntity{
		UserUUID: account.UserUUID,
		Address: rider.Address,
		RequestedAt: ptr.Time(time.Now()),
		Fare: &tripEntities.TripFareEntity{
			Food: ptr.Float64(body.FoodCost),
			Gas: ptr.Float64(body.GasCost),
			Trip: ptr.Float64(body.TripCost),
			Aggregated: ptr.Float64(body.TotalFare),
		},
	}

	trip.DriverRequests = append(trip.DriverRequests, newTripDriverRequest)

	_, err = tripsCollection.UpdateOne(ctx, bson.M{"trip_uuid": tripUUID}, bson.M{"$set": bson.M{"driver_requests": trip.DriverRequests}})
	if err != nil {
		fmt.Println("Error updating trip: ", err)
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
	})	
}

func RiderFlowRiderAcceptDriverRequest(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)
	
	tripUUID := chi.URLParam(req, "trip_uuid")
	driverUUID := chi.URLParam(req, "driver_uuid")

	db := datastores.GetMongoDatabase(context.Background())

	tripsCollection := db.Collection(datastores.Trips)

	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		fmt.Println("Error finding trip: ", err)
	}

	if trip.AssignedDriver != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "trip already has an assigned driver",
		})
	}

	if *trip.PostedBy != *account.UserUUID {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "you are not the driver of this trip",
		})
	}

	var driverRequest tripEntities.TripDriverRequestEntity
	for _, driverRequest1 := range trip.DriverRequests {
		if *driverRequest1.UserUUID == driverUUID {
			driverRequest = *driverRequest1
			break
		}
	}

	accountsCollection := db.Collection(datastores.Accounts)
	var driverAccount accountEntities.AccountEntity
	err = accountsCollection.FindOne(ctx, bson.M{"user_uuid": driverRequest.UserUUID}).Decode(&driverAccount)
	if err != nil {
		fmt.Println("Error finding driver account: ", err)
	}

	newAssignedDriver := &tripEntities.TripAssignedDriverEntity{
		UserUUID: driverRequest.UserUUID,
		Address: driverRequest.Address,
		Gender: driverAccount.Gender,
		AssignedAt: ptr.Time(time.Now()),
	}

	trip.AssignedDriver = newAssignedDriver

	// set the fare
	trip.Fare = driverRequest.Fare
	// remove the driver request from the trip
	for i, driverRequest1 := range trip.DriverRequests {
		if *driverRequest1.UserUUID == driverUUID {
			trip.DriverRequests = append(trip.DriverRequests[:i], trip.DriverRequests[i+1:]...)
			break
		}
	}

	_, err = tripsCollection.UpdateOne(ctx, bson.M{"trip_uuid": tripUUID}, bson.M{"$set": bson.M{"driver_requests": trip.DriverRequests, "assigned_driver": trip.AssignedDriver, "fare": trip.Fare}})
	if err != nil {
		fmt.Println("Error updating trip: ", err)
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"trip": trip,
	})	
}

func RiderFlowRiderRemoveDriver(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)
	
	tripUUID := chi.URLParam(req, "trip_uuid")
	driverUUID := chi.URLParam(req, "driver_uuid")

	db := datastores.GetMongoDatabase(context.Background())

	tripsCollection := db.Collection(datastores.Trips)

	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		fmt.Println("Error finding trip: ", err)
	}

	if trip.AssignedDriver == nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "trip does not have an assigned driver",
		})
	}

	if *trip.PostedBy != *account.UserUUID {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "you are not the driver of this trip",
		})
	}

	if *trip.AssignedDriver.UserUUID != driverUUID {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "you are not the assigned driver of this trip",
		})
	}

	trip.AssignedDriver = nil

	// clear the fare
	trip.Fare = &tripEntities.TripFareEntity{
		Food: ptr.Float64(0),
		Gas: ptr.Float64(0),
		Trip: ptr.Float64(0),
		Aggregated: ptr.Float64(0),
	}

	_, err = tripsCollection.UpdateOne(ctx, bson.M{"trip_uuid": tripUUID}, bson.M{"$set": bson.M{"assigned_driver": trip.AssignedDriver, "fare": trip.Fare}})
	if err != nil {
		fmt.Println("Error updating trip: ", err)
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"trip": trip,
	})	
}

func RiderFlowRiderRejectDriverRequest(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)
	
	tripUUID := chi.URLParam(req, "trip_uuid")
	driverUUID := chi.URLParam(req, "driver_uuid")

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

	var driverRequest *tripEntities.TripDriverRequestEntity
	for _, driverRequest1 := range trip.DriverRequests {
		if *driverRequest1.UserUUID == driverUUID {
			driverRequest = driverRequest1
			break
		}
	}

	if driverRequest == nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "driver request not found",
		})
	}

	// remove the driver request from the trip
	for i, driverRequest1 := range trip.DriverRequests {
		if *driverRequest1.UserUUID == driverUUID {
			trip.DriverRequests = append(trip.DriverRequests[:i], trip.DriverRequests[i+1:]...)
			break
		}
	}

	_, err = tripsCollection.UpdateOne(ctx, bson.M{"trip_uuid": tripUUID}, bson.M{"$set": bson.M{"driver_requests": trip.DriverRequests}})
	if err != nil {
		fmt.Println("Error updating trip: ", err)
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"trip": trip,
	})	
}

func RiderFlowDriverGetRequestedTrips(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)

	db := datastores.GetMongoDatabase(context.Background())

	tripsCollection := db.Collection(datastores.Trips)
	var trips []tripEntities.TripEntity
	cursor, err := tripsCollection.Find(ctx, bson.D{
		{Key: "driver_requests.user_uuid", Value: account.UserUUID},
	})
	if err != nil {
		fmt.Println("Error finding trips: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error finding trips",
		})
	}
	
	err = cursor.All(ctx, &trips)
	if err != nil {
		fmt.Println("Error decoding trips: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error decoding trips",
		})
	}

	if trips == nil {
		trips = []tripEntities.TripEntity{}
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"trips": trips,
	})	
}

func RiderFlowDriverRemoveFromTripFreeform(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)

	db := datastores.GetMongoDatabase(context.Background())

	tripUUID := chi.URLParam(req, "trip_uuid")

	tripsCollection := db.Collection(datastores.Trips)
	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.D{
		{Key: "trip_uuid", Value: tripUUID},
	}).Decode(&trip)

	if err != nil {
		fmt.Println("Error finding trips: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error finding trips",
		})
	}

	if trip.AssignedDriver != nil && *trip.AssignedDriver.UserUUID == *account.UserUUID {

		// Remove the assigned driver
		trip.AssignedDriver = nil

		_, err = tripsCollection.UpdateOne(ctx, bson.D{
			{Key: "trip_uuid", Value: tripUUID},
		}, bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "assigned_driver", Value: trip.AssignedDriver},
			}},
		})

		if err != nil {
			fmt.Println("Error updating trip: ", err)
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
				"error": "error updating trip",
			})
		}

		return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
			"success": true,
		})
	} else {
		// Remove from driver requests
		for i, driverRequest := range trip.DriverRequests {
			if *driverRequest.UserUUID == *account.UserUUID {
				trip.DriverRequests = append(trip.DriverRequests[:i], trip.DriverRequests[i+1:]...)
				break
			}
		}

		_, err = tripsCollection.UpdateOne(ctx, bson.D{
			{Key: "trip_uuid", Value: tripUUID},
		}, bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "driver_requests", Value: trip.DriverRequests},
			}},
		})

		return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
			"success": true,
		})
	}
}

func GetRidersInformation(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	db := datastores.GetMongoDatabase(context.Background())

	tripUUID := chi.URLParam(req, "trip_uuid")

	tripsCollection := db.Collection(datastores.Trips)
	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.D{
		{Key: "trip_uuid", Value: tripUUID},
	}).Decode(&trip)

	if err != nil {
		fmt.Println("Error finding trip: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error finding trip",
		})
	}

	if trip.Riders == nil || len(trip.Riders) == 0 {
		return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
			"success": true,
			"riders": []riderEntities.RiderEntity{},
		})
	}

	riders, err := GetTripArrayRiderInformation(*trip.Riders[0].UserUUID, []string{tripUUID})
	if err != nil {
		fmt.Println("Error getting riders: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error getting riders",
		})
	}
	
	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"riders": riders,
	})	
}