package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	datastores "code.gatorpool.internal/datastores/mongo"
	riderEntities "code.gatorpool.internal/rider/entities"
	tripEntities "code.gatorpool.internal/trip/entities"
	accountEntities "code.gatorpool.internal/account/entities"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"github.com/pborman/uuid"
)

/*
{
    "body": {
        "from": {
            "lat": 29.6436,
            "lng": -82.3549,
            "text": "University of Florida"
        },
        "to": {
            "lat": 25.773357,
            "lng": -80.1919,
            "text": "Miami, Florida, United States"
        },
        "datetime": "2025-04-07T20:26:12.210Z",
        "flexible_dates": false,
        "females_only": true
    }
}
*/
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
