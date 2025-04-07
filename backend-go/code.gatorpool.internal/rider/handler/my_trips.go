package handler

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"sort"
	"strconv"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetTripsRiderFlow(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {
	// Get the account object from context
	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	// Parse page number from query parameters
	page := 1
	if pageStr := req.URL.Query().Get("page"); pageStr != "" {
		if parsedPage, err := strconv.Atoi(pageStr); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	const itemsPerPage = 25
	skip := (page - 1) * itemsPerPage

	db := datastores.GetMongoDatabase(ctx)
	tripsCollection := db.Collection(datastores.Trips)

	// Get total count of trips
	totalTrips, err := tripsCollection.CountDocuments(ctx, bson.M{"riders.user_uuid": *account.UserUUID})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	// Calculate total pages
	totalPages := int(math.Ceil(float64(totalTrips) / float64(itemsPerPage)))

	// Get paginated trips
	var trips []*tripEntities.TripEntity
	opts := options.Find().SetSkip(int64(skip)).SetLimit(itemsPerPage)
	cursor, err := tripsCollection.Find(ctx, bson.M{"riders.user_uuid": *account.UserUUID}, opts)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var trip tripEntities.TripEntity
		if err := cursor.Decode(&trip); err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}
		trips = append(trips, &trip)
	}

	if trips == nil {
		trips = []*tripEntities.TripEntity{}
	}

	// sort trips by datetime
	sort.Slice(trips, func(i, j int) bool {
		return trips[i].Datetime.Before(*trips[j].Datetime)
	})

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"trips":       trips,
		"currentPage": page,
		"totalPages":  totalPages,
		"success":     true,
	})
}
