package handler

import (
	"context"
	"fmt"
	"net/http"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	dispatch "code.gatorpool.internal/fulfillment/dispatch"
	warningEntities "code.gatorpool.internal/fulfillment/entities"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"github.com/go-chi/chi"
	"github.com/pborman/uuid"
	"go.mongodb.org/mongo-driver/bson"
)

func CancelTripDriverFlow(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Get the account object from context
	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	tripUUID := chi.URLParam(req, "trip_uuid")

	db := datastores.GetMongoDatabase(ctx)
	tripsCollection := db.Collection(datastores.Trips)

	// Get all trips for the driver
	var trip *tripEntities.TripEntity
	err := tripsCollection.FindOne(ctx, bson.M{"trip_uuid": tripUUID}).Decode(&trip)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	if *trip.AssignedDriver.UserUUID != *account.UserUUID {
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "unauthorized",
		})
	}

	trip.Status = ptr.String("cancelled")
	trip.UpdatedAt = ptr.Time(time.Now())

	_, err = tripsCollection.UpdateOne(ctx, bson.M{"trip_uuid": tripUUID}, bson.M{"$set": trip})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	go func() {

		util.JSONResponse(res, http.StatusOK, map[string]interface{}{
			"success": true,
		})
	}()

	warning := &warningEntities.WarningEntity{
		WarningUUID: ptr.String(uuid.NewRandom().String()),
		UserUUID: account.UserUUID,
		Type: ptr.String("warning"),
		Points: ptr.Int(1),
		IssuedAt: ptr.Time(time.Now()),
		Reason: ptr.String("Trip cancelled"),
		IssuedBy: ptr.String(*account.UserUUID),
		Resolved: ptr.Bool(false),
		ResolvesAt: ptr.Time(time.Now().Add(time.Hour * 24 * 30)),
		ResolvedAt: nil,
		CreatedAt: ptr.Time(time.Now()),
		UpdatedAt: ptr.Time(time.Now()),
	}

	dispatch.DispatchWarningEvent(warning, *trip.AssignedDriver.UserUUID)

	return nil
}