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
	driverValidator "code.gatorpool.internal/driver/validator"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"github.com/pborman/uuid"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type LoadInRequestBody struct {
	HydrateDashboard *bool `json:"hydrate_dashboard"`
}

func DriverApply(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	var requestBody *driverEntities.RequestDriverApplyEntity
	err := json.NewDecoder(req.Body).Decode(&requestBody)
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	err = driverValidator.ValidateRequestDriverApply(requestBody)
	if err != nil {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{
			"error": err.Error(),
		})
	}

	// Get the account object from context
	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	db := datastores.GetMongoDatabase(ctx)
	driverApplicationCollection := db.Collection(datastores.DriverApplications)

	// Check if driver application already exists
	var driverApplication *driverEntities.DriverApplicationEntity
	err = driverApplicationCollection.FindOne(ctx, bson.M{"user_uuid": *account.UserUUID}).Decode(&driverApplication)
	if err != nil {
		if err != mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
				"error": err.Error(),
			})
		}
	}

	if driverApplication != nil && driverApplication.Closed != nil && !*driverApplication.Closed {
		return util.JSONResponse(res, http.StatusConflict, map[string]interface{}{
			"error": "driver application already exists",
		})
	}

	applicationUUID := uuid.NewRandom().String()
	vehicleUUID := uuid.NewRandom().String()

	newDriverApplication := &driverEntities.DriverApplicationEntity{
		ApplicationUUID: 	&applicationUUID,
		UserUUID:        	account.UserUUID,
		FullName:        	ptr.String(fmt.Sprintf("%s %s", *account.FirstName, *account.LastName)),
		Email:           	account.Email,
		PhoneNumber:     	requestBody.Phone,
		DateOfBirth:    	requestBody.DOB,
		Address: 	   		requestBody.Address,
		AddressLine2:   	requestBody.AddressLine2,
		City: 		   		requestBody.City,
		State: 		   		requestBody.State,
		ZipCode: 	   		requestBody.Zip,
		Accepted: 	 		ptr.Bool(false),
		AcceptedAt: 		nil,
		Message: 			nil,
		Closed: 			ptr.Bool(false),
		CreatedAt: 			ptr.Time(time.Now()),
		UpdatedAt: 			ptr.Time(time.Now()),
		Vehicle: 			&driverEntities.VehicleEntity{
			VehicleUUID: 	&vehicleUUID,
			Make: 			requestBody.Make,
			Model: 			requestBody.Model,
			Year: 			requestBody.Year,
			Color: 			requestBody.Color,
			LicensePlate: 	requestBody.LicensePlate,
			State: 			requestBody.LicenseState,
			Seats: 			requestBody.Seats,
			Lugroom: 		requestBody.Lugroom,
			CreatedAt: 		ptr.Time(time.Now()),
		},
	}

	_, err = driverApplicationCollection.InsertOne(ctx, newDriverApplication)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	newDriverEntity := &driverEntities.DriverEntity{
		DriverUUID: account.UserUUID,
		PastTrips: []*string{},
		Rating: nil,
		Disceplanary: nil,
		Applications: []*driverEntities.DriverApplicationEntity{
			newDriverApplication,
		},
		Vehicles: []*driverEntities.VehicleEntity{
			newDriverApplication.Vehicle,
		},
		Verified: ptr.Bool(false),
		VerifiedAt: nil,
		CreatedAt: ptr.Time(time.Now()),
		UpdatedAt: ptr.Time(time.Now()),
	}

	driverCollection := db.Collection(datastores.Drivers)
	_, err = driverCollection.InsertOne(ctx, newDriverEntity)
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return util.JSONResponse(res, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "driver application created",
	})
}