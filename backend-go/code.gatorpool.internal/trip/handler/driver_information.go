package handler

import (
	"context"
	"errors"

	accountEntities "code.gatorpool.internal/account/entities"
	"code.gatorpool.internal/datastores/gcs"
	datastores "code.gatorpool.internal/datastores/mongo"
	driverEntities "code.gatorpool.internal/driver/entities"
	tripEntities "code.gatorpool.internal/trip/entities"

	"go.mongodb.org/mongo-driver/bson"
)

type DriverProfile struct {
	FirstName string `json:"first_name"`
	LastName string `json:"last_name"`
	ProfilePicture string `json:"profile_picture"`
	Phone string `json:"phone"`
	Email string `json:"email"`
	Gender string `json:"gender"`
	Rating *float64 `json:"rating"`
	Vehicle *driverEntities.VehicleEntity `json:"vehicle"`
	TripUUID string `json:"trip_uuid"`
	UserUUID string `json:"user_uuid"`
}

func GetTripArrayDriverInformation(tripUUIDs []string) ([]*DriverProfile, error) {

	ctx := context.Background()

	db := datastores.GetMongoDatabase(ctx)
	tripsCollection := db.Collection(datastores.Trips)
	accountsCollection := db.Collection(datastores.Accounts)
	driversCollection := db.Collection(datastores.Drivers)

	var trips []*tripEntities.TripEntity
	cursor, err := tripsCollection.Find(ctx, bson.M{"trip_uuid": bson.M{"$in": tripUUIDs}})
	if err != nil {
		return nil, err
	}

	if err := cursor.All(ctx, &trips); err != nil {
		return nil, err
	}

	var driverProfiles []*DriverProfile
	
	for _, trip := range trips {
		if trip.AssignedDriver == nil {
			return nil, errors.New("no driver assigned to trip")
		}

		var driverAccount accountEntities.AccountEntity
		err = accountsCollection.FindOne(ctx, bson.M{"user_uuid": trip.AssignedDriver.UserUUID}).Decode(&driverAccount)
		if err != nil {
			return nil, err
		}

		var driverProfile driverEntities.DriverEntity
		err = driversCollection.FindOne(ctx, bson.M{"driver_uuid": trip.AssignedDriver.UserUUID}).Decode(&driverProfile)
		if err != nil {
			return nil, err
		}

		profilePictureURL := ""

		if driverAccount.ProfilePicture != nil && *driverAccount.ProfilePicture {
			signedURLs, err := gcs.CreateSignedURL([]string{*driverAccount.ProfilePictureObj.ImageGCSPath})
			if err != nil {
				return nil, err
			}

			profilePictureURL = signedURLs[0].SignedURL
		} else {
			profilePictureURL = "https://storage.googleapis.com/gatorpool-449522.appspot.com/default_pfp.png"
		}

		driverProfiles = append(driverProfiles, &DriverProfile{
			FirstName: *driverAccount.FirstName,
			LastName: *driverAccount.LastName,
			ProfilePicture: profilePictureURL,
			Email: *driverAccount.Email,
			Gender: *driverAccount.Gender,
			Rating: driverProfile.Rating,
			Vehicle: driverProfile.Vehicles[0],
			TripUUID: *trip.TripUUID,
			UserUUID: *trip.AssignedDriver.UserUUID,
		})
	}

	type ReturnDriverInformation struct {
		DriverProfiles []*DriverProfile `json:"driver_profiles"`
	}

	return driverProfiles, nil
}