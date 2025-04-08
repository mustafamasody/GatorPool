package handler

import (
	"context"
	"encoding/json"
	"fmt"
	// "math"
	"net/http"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	tripEntities "code.gatorpool.internal/trip/entities"
	tripHandler "code.gatorpool.internal/trip/handler"
	"code.gatorpool.internal/util"

	"go.mongodb.org/mongo-driver/bson"
)

type QueryTripsRequestBody struct {
	Body QueryTripsBodyRequest `json:"body"`
}

type QueryTripsBodyRequest struct {
	From struct {
		Lat float64 `json:"latitude"`
		Lng float64 `json:"longitude"`
	} `json:"from"`
	To struct {
		Lat float64 `json:"latitude"`
		Lng float64 `json:"longitude"`
	} `json:"to"`
	Datetime string `json:"datetime"`
}

func QueryTripsFeed(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	var requestBody QueryTripsRequestBody
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

	datetime, err := time.Parse(time.RFC3339, body.Datetime)
	if err != nil {
		fmt.Println("Error parsing datetime: ", err)
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "invalid datetime",
		})
	}

	query := bson.M{
		"status": "pending",
		"posted_by_type": "rider",
		"flow_type": "rider_requests_driver",
	}

	// // Find trips where the driver's destination waypoint is within 50 miles
	// round := func(val float64) float64 {
	// 	return math.Round(val*1e6) / 1e6
	// }

	// lat := round(body.To.Lat)
	// lng := round(body.To.Lng)

	// query["waypoints"] = bson.M{
	// 	"$elemMatch": bson.M{
	// 		"type": "destination",
	// 		"for":  "driver",
	// 		"latitude": bson.M{
	// 			"$gte": lat - 0.725,
	// 			"$lte": lat + 0.725,
	// 		},
	// 		"longitude": bson.M{
	// 			"$gte": lng - 0.725,
	// 			"$lte": lng + 0.725,
	// 		},
	// 	},
	// }

	// assigned_driver is null or nonexistent
	// query["$or"] = []bson.M{
	// 	{ "assigned_driver": bson.M{"$exists": false} },
	// 	{ "assigned_driver": nil },
	// }	

	query["waypoints"] = bson.M{
		"$all": []interface{}{
			bson.M{
				"$elemMatch": bson.M{
					"type": "pickup",
					"for":  "driver",
					"latitude": bson.M{
						"$gte": body.From.Lat - 0.725,
						"$lte": body.From.Lat + 0.725,
					},
					"longitude": bson.M{
						"$gte": body.From.Lng - 0.725,
						"$lte": body.From.Lng + 0.725,
					},
				},
			},
			bson.M{
				"$elemMatch": bson.M{
					"type": "destination",
					"for":  "driver",
					"latitude": bson.M{
						"$gte": body.To.Lat - 0.725,
						"$lte": body.To.Lat + 0.725,
					},
					"longitude": bson.M{
						"$gte": body.To.Lng - 0.725,
						"$lte": body.To.Lng + 0.725,
					},
				},
			},
		},
	}	

	// Filter the trips that are within 48 hours of the datetime
	query["datetime"] = bson.M{
		"$gte": datetime.Add(-24 * 7 * time.Hour),
		"$lte": datetime.Add(24 * 7 * time.Hour),
	}
	
	cursor, err := tripsCollection.Find(ctx, query)
	if err != nil {
		fmt.Println("Error finding trips: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error finding trips",
		})
	}
	defer cursor.Close(ctx)

	var trips []tripEntities.TripEntity
	if err = cursor.All(ctx, &trips); err != nil {
		fmt.Println("Error decoding trips: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error decoding trips",
		})
	}

	if trips == nil {
		trips = []tripEntities.TripEntity{}
	}

	var newTrips []tripEntities.TripEntity
	// check if any trip is in the past
	now := time.Now().UTC()
	for _, trip := range trips {
		if trip.Datetime.After(now) {
			newTrips = append(newTrips, trip)
		}
	}	

	if newTrips == nil {
		newTrips = []tripEntities.TripEntity{}
	}

	if len(newTrips) == 0 {
		return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
			"trips":   newTrips,
			"driverProfiles": []string{},
			"success": true,
		})
	}

	var tripUUIDs []string
	for _, trip := range newTrips {
		tripUUIDs = append(tripUUIDs, *trip.TripUUID)
	}

	riderProfiles, err := tripHandler.GetTripArrayRiderInformation(*account.UserUUID, tripUUIDs)
	if err != nil {
		fmt.Println("Error getting rider profiles: ", err)
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": "error getting rider profiles",
		})
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"trips":   newTrips,
		"riderProfiles": riderProfiles,
		"success": true,
	})
}
