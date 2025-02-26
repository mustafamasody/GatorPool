package handler

import (
	"context"
	"net/http"

	datastores "code.gatorpool.internal/datastores/mongo"
	driverEntities "code.gatorpool.internal/driver/entities"
	"code.gatorpool.internal/util"
	"github.com/go-chi/chi"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetIndividualApplication(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Extract the application_uuid from the URL path
	applicationUUID := chi.URLParam(req, "application_uuid")
	if applicationUUID == "" {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": "missing application UUID",
		})
	}

	db := datastores.GetMongoDatabase(ctx)
	driverApplicationCollection := db.Collection(datastores.DriverApplications)

	// Check if driver application already exists
	var driverApplication *driverEntities.DriverApplicationEntity
	err := driverApplicationCollection.FindOne(ctx, bson.M{"application_uuid": applicationUUID}).Decode(&driverApplication)
	if err != nil {
		if err != mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		} else {
			return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{
				"error": "driver application not found",
			})
		}
	}

	return util.JSONResponse(res, http.StatusCreated, map[string]interface{}{
		"success": true,
		"driver_application": driverApplication,
	})
}