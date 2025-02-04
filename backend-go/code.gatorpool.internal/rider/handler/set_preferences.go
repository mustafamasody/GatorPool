package handler

import (
	"context"
	"fmt"
	"net/http"

	datastores "code.gatorpool.internal/datastores/mongo"
	riderEntities "code.gatorpool.internal/rider/entities"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/requesthydrator"

	"go.mongodb.org/mongo-driver/bson"
)

func SetRidePreferences(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	rider, ok := req.Context().Value("rider").(*riderEntities.RiderEntity) // No pointer
	if !ok {
		fmt.Println("Rider object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no rider in context",
		})
	}

	body, err := requesthydrator.ParseJSONBody(req, []string{
		"pay_for_food",
		"pay_for_gas",
	})
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	payForFood := body["pay_for_food"].(bool)
	payForGas := body["pay_for_gas"].(bool)

	rider.Options = &riderEntities.RiderOptionsEntity{
		PayFood: &payForFood,
		PayGas:  &payForGas,
	}

	db := datastores.GetMongoDatabase(ctx)
	riderCollection := db.Collection(datastores.Riders)

	riderQuery := bson.D{{Key: "rider_uuid", Value: rider.RiderUUID}}
	update := bson.D{{Key: "$set", Value: bson.D{{Key: "options", Value: rider.Options}}}}
	_, err = riderCollection.UpdateOne(ctx, riderQuery, update)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
	})
}
