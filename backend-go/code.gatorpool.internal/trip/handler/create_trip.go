package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	driverEntities "code.gatorpool.internal/driver/entities"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"github.com/pborman/uuid"

	"go.mongodb.org/mongo-driver/bson"
)

type RequestBody struct {
	Body CreateTripBodyRequest `json:"tripOptions"`
}

type CreateTripBodyRequest struct {
	From struct {
		Lat      float64 `json:"lat"`
		Lng      float64 `json:"lng"`
		Expected int64   `json:"expected"`
		Text     string  `json:"text"`
	} `json:"from"`
	To struct {
		Lat      float64 `json:"lat"`
		Lng      float64 `json:"lng"`
		Expected int64   `json:"expected"`
		Text     string  `json:"text"`
	} `json:"to"`
	Radius        int64  `json:"radius"`
	Datetime      string `json:"datetime"`
	AcPreferences struct {
		CanBeControlled bool `json:"can_be_controlled"`
	} `json:"ac_preferences"`
	MusicPreferences struct {
		CanBeControlled bool `json:"can_be_controlled"`
	} `json:"music_preferences"`
	TalkingPreferences struct {
		Minimal bool `json:"minimal"`
		Silent  bool `json:"silent"`
	} `json:"talking_preferences"`
	Carpool bool `json:"carpool"`
	Fare    struct {
		Gas  float64 `json:"gas"`
		Trip float64 `json:"trip"`
		Food float64 `json:"food"`
	} `json:"fare"`
	RiderRequirements struct {
		FemalesOnly bool `json:"females_only"`
	} `json:"rider_requirements"`
}

func CreateTrip(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	var requestBody RequestBody
	err := json.NewDecoder(req.Body).Decode(&requestBody)
	if err != nil {
		fmt.Println("Error decoding body: ", err)
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "invalid body",
		})
	}

	body := requestBody.Body

	db := datastores.GetMongoDatabase(ctx)

	tripsCollection := db.Collection(datastores.Trips)
	driverCollection := db.Collection(datastores.Drivers)

	var driver driverEntities.DriverEntity
	driverQuery := bson.D{{Key: "driver_uuid", Value: account.UserUUID}}
	err = driverCollection.FindOne(ctx, driverQuery).Decode(&driver)
	if err != nil {
		fmt.Println("Error finding driver: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error finding driver",
		})
	}

	newTripUuid := uuid.NewRandom().String()

	fromWaypoint := &tripEntities.WaypointEntity{
		Type: ptr.String("pickup"),
		For:  ptr.String("driver"),
		Data: map[string]interface{}{
			"driver_uuid": driver.DriverUUID,
		},
		Latitude:  ptr.Float64(body.From.Lat),
		Longitude: ptr.Float64(body.From.Lng),
		Expected:  ptr.Time(time.UnixMilli(body.From.Expected)),
		Actual:    ptr.Time(time.UnixMilli(body.From.Expected)),
		GeoText:   ptr.String(body.From.Text),
	}

	toWaypoint := &tripEntities.WaypointEntity{
		Type: ptr.String("destination"),
		For:  ptr.String("driver"),
		Data: map[string]interface{}{
			"driver_uuid": driver.DriverUUID,
		},
		Latitude:  ptr.Float64(body.To.Lat),
		Longitude: ptr.Float64(body.To.Lng),
		Expected:  ptr.Time(time.UnixMilli(body.To.Expected)),
		Actual:    ptr.Time(time.UnixMilli(body.To.Expected)),
		GeoText:   ptr.String(body.To.Text),
	}

	assignedDriver := &tripEntities.TripAssignedDriverEntity{
		UserUUID:   driver.DriverUUID,
		Address:    toWaypoint,
		AssignedAt: ptr.Time(time.Now()),
		Gender:     account.Gender,
	}

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

	aggregatedFare := body.Fare.Gas + body.Fare.Trip + body.Fare.Food

	payGasRiderRequirement := false
	payFoodRiderRequirement := false

	if body.Fare.Gas > 0 {
		payGasRiderRequirement = true
	}

	if body.Fare.Food > 0 {
		payFoodRiderRequirement = true
	}

	newTrip := &tripEntities.TripEntity{
		TripUUID:        ptr.String(newTripUuid),
		Waypoints:       []*tripEntities.WaypointEntity{fromWaypoint, toWaypoint},
		AssignedDriver:  assignedDriver,
		PostedBy:        account.UserUUID,
		PostedByType:    ptr.String("driver"),
		FlowType:        ptr.String("driver_requests_riders"),
		Carpool:         ptr.Bool(body.Carpool),
		Datetime:        ptr.Time(datetime),
		CurrentLocation: fromWaypoint,
		Riders:          []*tripEntities.TripRiderEntity{},
		Status:          ptr.String("pending"),
		Fare: &tripEntities.TripFareEntity{
			Gas:        ptr.Float64(body.Fare.Gas),
			Trip:       ptr.Float64(body.Fare.Trip),
			Food:       ptr.Float64(body.Fare.Food),
			Aggregated: ptr.Float64(aggregatedFare),
		},
		RiderRequirements: &tripEntities.TripRiderRequirementsEntity{
			PayGas:  &payGasRiderRequirement,
			PayFood: &payFoodRiderRequirement,
		},
		Miscellaneous: &tripEntities.TripMiscellaneousEntity{
			Music: &tripEntities.TripMiscellaneousMusicOptionsEntity{
				CanBeControlled: ptr.Bool(body.MusicPreferences.CanBeControlled),
			},
			AC: &tripEntities.TripMiscellaneousACOptionsEntity{
				CanBeControlled: ptr.Bool(body.AcPreferences.CanBeControlled),
			},
			Talking: &tripEntities.TripMiscellaneousTalkingOptionsEntity{},
		},
		Conflicts:        []*tripEntities.TripConflictEntity{},
		MaxRadiusDropOff: ptr.Float64(float64(body.Radius)),
		CreatedAt:        ptr.Time(time.Now()),
		UpdatedAt:        ptr.Time(time.Now()),
	}

	if body.TalkingPreferences.Minimal {
		newTrip.Miscellaneous.Talking.Type = ptr.String("minimal")
	}

	if body.TalkingPreferences.Silent {
		newTrip.Miscellaneous.Talking.Type = ptr.String("silent")
	}

	if body.RiderRequirements.FemalesOnly {
		if *account.Gender != "female" {
			return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
				"error": "you are not a female",
			})
		} else {
			newTrip.RiderRequirements.FemalesOnly = ptr.Bool(true)
		}
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
		"success":   true,
	})
}
