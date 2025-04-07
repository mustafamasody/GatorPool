package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"

	"go.mongodb.org/mongo-driver/bson"
)

type QueryTripsRequestBody struct {
	Body QueryTripsBodyRequest `json:"body"`
}

type QueryTripsBodyRequest struct {
	From struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"from"`
	To struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"to"`
	Datetime      string `json:"datetime"`
	FemalesOnly   *bool  `json:"females_only"`
	FlexibleDates *bool  `json:"flexible_dates"`
}

func QueryTrips(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

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
	}

	if body.FemalesOnly != nil && *body.FemalesOnly {
		if *account.Gender != "female" {
			return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
				"error": "you are not a female",
			})
		} else {
			query["assigned_driver.gender"] = "female"
		}
	}

	// Find trips where the driver's destination waypoint is within 50 miles
	round := func(val float64) float64 {
		return math.Round(val*1e6) / 1e6
	}

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

	query["$and"] = []bson.M{
		{
			"waypoints": bson.M{
				"$elemMatch": bson.M{
					"type": "pickup",
					"for":  "driver",
					"latitude": bson.M{
						"$gte": round(body.From.Lat - 0.725),
						"$lte": round(body.From.Lat + 0.725),
					},
					"longitude": bson.M{
						"$gte": round(body.From.Lng - 0.725),
						"$lte": round(body.From.Lng + 0.725),
					},
				},
			},
		},
		{
			"waypoints": bson.M{
				"$elemMatch": bson.M{
					"type": "destination",
					"for":  "driver",
					"latitude": bson.M{
						"$gte": round(body.To.Lat - 0.725),
						"$lte": round(body.To.Lat + 0.725),
					},
					"longitude": bson.M{
						"$gte": round(body.To.Lng - 0.725),
						"$lte": round(body.To.Lng + 0.725),
					},
				},
			},
		},
	}

	if body.FlexibleDates != nil && *body.FlexibleDates {
		// Filter the trips that are within 48 hours of the datetime
		query["datetime"] = bson.M{
			"$gte": datetime.Add(-48 * time.Hour),
			"$lte": datetime.Add(48 * time.Hour),
		}
	} else {
		// Filter the trips that are within 8 hours of the datetime
		query["datetime"] = bson.M{
			"$gte": datetime.Add(-8 * time.Hour),
			"$lte": datetime.Add(8 * time.Hour),
		}
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
	for _, trip := range trips {
		if trip.Datetime.After(time.Now()) {
			newTrips = append(newTrips, trip)
		}
	}

	if newTrips == nil {
		newTrips = []tripEntities.TripEntity{}
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"trips":   newTrips,
		"success": true,
	})
}
