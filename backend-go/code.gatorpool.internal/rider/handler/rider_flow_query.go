package handler

import (
	"context"
	"fmt"
	"net/http"

	datastores "code.gatorpool.internal/datastores/mongo"
	riderEntities "code.gatorpool.internal/rider/entities"
	"code.gatorpool.internal/util"

	"go.mongodb.org/mongo-driver/bson"
)

func GetRiderFlowQueries(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	rider, ok := req.Context().Value("rider").(*riderEntities.RiderEntity) // No pointer
	if !ok {
		fmt.Println("Rider object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no rider in context",
		})
	}

	db := datastores.GetMongoDatabase(context.Background())

	riderCollection := db.Collection(datastores.Riders)

	if rider.Queries == nil {
		rider.Queries = []*riderEntities.RiderQueryEntity{}

		_, err := riderCollection.UpdateOne(context.Background(), bson.M{"rider_uuid": rider.RiderUUID}, bson.M{"$set": bson.M{"queries": rider.Queries}})
		if err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}

		return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
			"queries": rider.Queries,
			"success": true,
		})
	}

	return util.JSONGzipResponse(res, http.StatusOK, map[string]interface{}{
		"queries": rider.Queries,
		"success": true,
	})
}
