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
	"github.com/pborman/uuid"
	"go.mongodb.org/mongo-driver/bson"
)

type RiderRequestTripBody struct {
	Body struct {
		From struct {
			Lat float64 `json:"lat"`
			Lng float64 `json:"lng"`
			Text string  `json:"text"`
		} `json:"from"`
		To struct {
			Lat float64 `json:"lat"`
			Lng float64 `json:"lng"`
			Text string  `json:"text"`
		} `json:"to"`
		Datetime string `json:"datetime"`
		FemalesOnly bool `json:"females_only"`
		FlexibleDates bool `json:"flexible_dates"`
	} `json:"body"`
	PayForGas bool `json:"pay_for_gas"`
	PayForFood bool `json:"pay_for_food"`
}

func RiderRequestTrip(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)
	
	rider, ok := req.Context().Value("rider").(*riderEntities.RiderEntity) // No pointer
	if !ok {
		fmt.Println("Rider object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no rider in context",
		})
	}

	db := datastores.GetMongoDatabase(context.Background())

	tripsCollection := db.Collection(datastores.Trips)

	var outerBody RiderRequestTripBody
	err := json.NewDecoder(req.Body).Decode(&outerBody)
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	body := outerBody.Body

	// body.Datetime is: 2025-03-19T18:45:22.000Z
	if body.Datetime == "" {
		fmt.Println("Error: datetime field is empty")
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "datetime field is required",
		})
	}

	datetime, err := time.Parse(time.RFC3339, body.Datetime)
	if err != nil {
		fmt.Println("Error parsing datetime: ", err)
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "invalid datetime",
		})
	}

	newTripUuid := uuid.NewRandom().String()

	fromWaypoint := &tripEntities.WaypointEntity{
		Type: ptr.String("pickup"),
		For:  ptr.String("driver"),
		Data: map[string]interface{}{},
		Latitude:  ptr.Float64(body.From.Lat),
		Longitude: ptr.Float64(body.From.Lng),
		GeoText:   ptr.String(body.From.Text),
	}

	toWaypoint := &tripEntities.WaypointEntity{
		Type: ptr.String("destination"),
		For:  ptr.String("driver"),
		Data: map[string]interface{}{},
		Latitude:  ptr.Float64(body.To.Lat),
		Longitude: ptr.Float64(body.To.Lng),
		GeoText:   ptr.String(body.To.Text),
	}

	femalesOnly := false
	if body.FemalesOnly && *account.Gender == "female" {
		femalesOnly = true
	}

	tripRiderEntity := &tripEntities.TripRiderEntity{
		UserUUID: rider.RiderUUID,
		Address: fromWaypoint,
		Accepted: ptr.Bool(true),
		AcceptedAt: ptr.Time(time.Now()),
		Rating: nil,
		Review: nil,
		Willing: &tripEntities.TripRiderWillingEntity{
			PayFood: ptr.Bool(outerBody.PayForFood),
			PayGas: ptr.Bool(outerBody.PayForGas),
			Custom: map[string]interface{}{},
		},
	}

	newTrip := &tripEntities.TripEntity{
		TripUUID:        ptr.String(newTripUuid),
		Waypoints:       []*tripEntities.WaypointEntity{fromWaypoint, toWaypoint},
		AssignedDriver: nil,
		PostedBy:        rider.RiderUUID,
		PostedByType:    ptr.String("rider"),
		FlowType:        ptr.String("rider_requests_driver"),
		Carpool:         ptr.Bool(false),
		Datetime:        ptr.Time(datetime),
		CurrentLocation: fromWaypoint,
		Riders:          []*tripEntities.TripRiderEntity{tripRiderEntity},
		Status:          ptr.String("pending"),
		DriverRequirements: &tripEntities.TripDriverRequirementsEntity{
			FemalesOnly: ptr.Bool(femalesOnly),
		},
		Fare: &tripEntities.TripFareEntity{
			Gas:        ptr.Float64(0),
			Trip:       ptr.Float64(0),
			Food:       ptr.Float64(0),
			Aggregated: ptr.Float64(0),
		},
		DriverRequests: []*tripEntities.TripDriverRequestEntity{},
		RiderRequirements: &tripEntities.TripRiderRequirementsEntity{},
		Miscellaneous: &tripEntities.TripMiscellaneousEntity{
			Music: &tripEntities.TripMiscellaneousMusicOptionsEntity{
				CanBeControlled: ptr.Bool(true),
			},
			AC: &tripEntities.TripMiscellaneousACOptionsEntity{
				CanBeControlled: ptr.Bool(true),
			},
			Talking: &tripEntities.TripMiscellaneousTalkingOptionsEntity{},
		},
		Conflicts:        []*tripEntities.TripConflictEntity{},
		MaxRadiusDropOff: ptr.Float64(float64(50)),
		CreatedAt:        ptr.Time(time.Now()),
		UpdatedAt:        ptr.Time(time.Now()),
	}

	_, err = tripsCollection.InsertOne(ctx, newTrip)
	if err != nil {
		fmt.Println("Error inserting trip: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error inserting trip",
		})
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"trip_uuid": newTripUuid,
		"success": true,
	})
}

func DriverFlowRiderRequestTrip(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, _ := req.Context().Value("account").(accountEntities.AccountEntity)
	
	tripUUID := chi.URLParam(req, "trip_uuid")

	db := datastores.GetMongoDatabase(context.Background())

	tripsCollection := db.Collection(datastores.Trips)

	var trip tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		fmt.Println("Error finding trip: ", err)
	}

	// UNCOMMENT THIS IN PRODUCTION

	// if *trip.PostedByType == "driver" && *trip.PostedBy == *account.UserUUID {
	// 	return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
	// 		"error": "you cannot request a trip that you posted",
	// 	})
	// }
	
	for _, rider := range trip.Riders {
		if *rider.UserUUID == *account.UserUUID {
			return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
				"error": "you have already requested this trip or are a rider on this trip",
			})
		}
	}

	newWaypoint := &tripEntities.WaypointEntity{
		Type: ptr.String("pickup"),
		For:  ptr.String("rider"),
		Data: map[string]interface{}{
			"rider_uuid": account.UserUUID,
			"first_name": account.FirstName,
			"last_name": account.LastName,
		},
		Latitude:  trip.Waypoints[0].Latitude,
		Longitude: trip.Waypoints[0].Longitude,
		Name: trip.Waypoints[0].Name,
		Address: trip.Waypoints[0].Address,
		Address2: trip.Waypoints[0].Address2,
		City: trip.Waypoints[0].City,
		State: trip.Waypoints[0].State,
		Zip: trip.Waypoints[0].Zip,
		GeoText: trip.Waypoints[0].GeoText,
		Expected: trip.Waypoints[0].Expected,
		Actual: trip.Waypoints[0].Actual,
	}

	tripRiderEntity := &tripEntities.TripRiderEntity{
		UserUUID: account.UserUUID,
		Address: newWaypoint,
		Accepted: ptr.Bool(false),
		AcceptedAt: nil,
		Rating: nil,
		Review: nil,
		Willing: &tripEntities.TripRiderWillingEntity{
			PayFood: trip.RiderRequirements.PayFood,
			PayGas: trip.RiderRequirements.PayGas,
			Custom: map[string]interface{}{},
		},
		CreatedAt: ptr.Time(time.Now()),
	}

	trip.Riders = append(trip.Riders, tripRiderEntity)

	_, err = tripsCollection.UpdateOne(ctx, bson.M{"trip_uuid": tripUUID}, bson.M{"$set": bson.M{"riders": trip.Riders}})
	if err != nil {
		fmt.Println("Error updating trip: ", err)
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
	})	
}

func DriverFlowAcceptRiderRequest(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

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
			trip.Riders[i].Accepted = ptr.Bool(true)
			trip.Riders[i].AcceptedAt = ptr.Time(time.Now())
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

func DriverFlowRejectRiderRequest(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

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