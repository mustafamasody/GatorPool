package handler

import (
	"context"
	"fmt"
	"net/http"

	// "os"
	// "regexp"
	// "strconv"
	// "strings"

	datastores "code.gatorpool.internal/datastores/mongo"
	riderEntities "code.gatorpool.internal/rider/entities"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"code.gatorpool.internal/util/requesthydrator"

	// "code.gatorpool.internal/util/requesthydrator"
	// "github.com/pborman/uuid"
	"go.mongodb.org/mongo-driver/bson"
)

func SaveAddress(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	rider, ok := req.Context().Value("rider").(*riderEntities.RiderEntity) // No pointer
	if !ok {
		fmt.Println("Rider object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no rider in context",
		})
	}

	body, err := requesthydrator.ParseJSONBody(req, []string{
		"address",
		"address_line1",
		"address_line2",
		"city",
		"state",
		"zip",
		"latitude",
		"longitude",
	})
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	address := body["address"].(string)
	addressLine1 := body["address_line1"].(string)
	addressLine2 := body["address_line2"].(string)
	city := body["city"].(string)
	state := body["state"].(string)
	zip := body["zip"].(string)
	latitude := body["latitude"].(float64)
	longitude := body["longitude"].(float64)

	rider.Address = &tripEntities.WaypointEntity{
		Type: ptr.String("home"),
		For: ptr.String("rider"),
		Data: map[string]interface{}{
			"rider_uuid": rider.RiderUUID,
		},
		Name: &address,
		Address: &addressLine1,
		Address2: &addressLine2,
		City: &city,
		State: &state,
		Zip: &zip,
		Latitude: &latitude,
		Longitude: &longitude,
	}

	db := datastores.GetMongoDatabase(ctx)
	riderCollection := db.Collection(datastores.Riders)

	riderQuery := bson.D{{Key: "rider_uuid", Value: rider.RiderUUID}}
	update := bson.D{{Key: "$set", Value: bson.D{{Key: "address", Value: rider.Address}}}}
	_, err = riderCollection.UpdateOne(ctx, riderQuery, update)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"address": rider.Address,
	})
}
