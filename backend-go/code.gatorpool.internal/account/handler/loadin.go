package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	// "os"
	// "regexp"
	// "strconv"
	// "strings"
	"time"

	accountEntities "code.gatorpool.internal/account/entities"
	"code.gatorpool.internal/datastores/gcs"
	datastores "code.gatorpool.internal/datastores/mongo"
	driverEntities "code.gatorpool.internal/driver/entities"
	riderEntities "code.gatorpool.internal/rider/entities"
	tripEntities "code.gatorpool.internal/trip/entities"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"github.com/pborman/uuid"

	// "code.gatorpool.internal/util/requesthydrator"
	// "github.com/pborman/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	// "go.mongodb.org/mongo-driver/bson/primitive"
	// "go.mongodb.org/mongo-driver/mongo"
)

type LoadInRequestBody struct {
	HydrateDashboard *bool `json:"hydrate_dashboard"`
}

func LoadIn(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	var body LoadInRequestBody
	err := json.NewDecoder(req.Body).Decode(&body)
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

	rider, ok := req.Context().Value("rider").(*riderEntities.RiderEntity) // No pointer
	if !ok {
		fmt.Println("Rider object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no rider in context",
		})
	}

	defaultReturn := make(map[string]interface{})
	defaultReturn["success"] = true
	defaultReturn["first_name"] = account.FirstName
	defaultReturn["last_name"] = account.LastName
	defaultReturn["email"] = account.Email
	defaultReturn["user_uuid"] = account.UserUUID
	defaultReturn["onboarding_status"] = account.OnboardingStatus
	defaultReturn["is_female"] = *account.Gender == "female"

	db := datastores.GetMongoDatabase(ctx)

	accountsCollection := db.Collection(datastores.Accounts)
	accountQuery := bson.D{{Key: "user_uuid", Value: account.UserUUID}}

	if *account.ProfilePicture {

		// Image URL expiry time is 2 hours, if it's expired, generate a new signed URL
		if time.Now().UnixMilli() > *account.ProfilePictureObj.ImageURLExpiryAt {
			fmt.Println("Generating new signed URL for profile picture")

			// Format the expiry time
			timeFormat := time.UnixMilli(*account.ProfilePictureObj.ImageURLExpiryAt).Format("2006-01-02 15:04:05")
			fmt.Println("Time it expired at: ", timeFormat)
			mediaEntities, err := gcs.CreateSignedURL([]string{
				*account.ProfilePictureObj.ImageGCSPath,
			})

			if err != nil {
				return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
			}

			account.ProfilePictureObj.ImageURL = &mediaEntities[0].SignedURL
			account.ProfilePictureObj.ImageURLExpiryAt = ptr.Int64(mediaEntities[0].Date.Add(time.Minute * 20).UnixMilli())

			_, err = accountsCollection.UpdateOne(ctx, accountQuery, bson.D{{Key: "$set", Value: account}})
			if err != nil {
				return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
			}

			defaultReturn["profile_picture"] = *account.ProfilePictureObj.ImageURL
			defaultReturn["profile_picture_expiry"] = *account.ProfilePictureObj.ImageURLExpiryAt

		} else {
			defaultReturn["profile_picture"] = *account.ProfilePictureObj.ImageURL
			defaultReturn["profile_picture_expiry"] = *account.ProfilePictureObj.ImageURLExpiryAt
		}
	} else {
		defaultReturn["profile_picture"] = "https://storage.googleapis.com/gatorpool-449522.appspot.com/default_pfp.png"
		defaultReturn["profile_picture_expiry"] = time.Now().Add(time.Minute * 20).UnixMilli()
	}

	// Status cards are shown right under the display cards on the dashboard.
	// They can be either information, warning, or critical.
	if body.HydrateDashboard != nil && *body.HydrateDashboard {
		statusCards, bottomCards := HydrateDashboard(account, *rider)

		defaultReturn["status_cards"] = statusCards
		defaultReturn["bottom_actions"] = bottomCards
	}

	if rider.Address != nil && rider.Address.Name != nil {
		defaultReturn["address"] = *rider.Address.Name
		defaultReturn["address_lat"] = *rider.Address.Latitude
		defaultReturn["address_lng"] = *rider.Address.Longitude
	}
		
	// If they are a driver, validate them. This will control whether or not they can view
	// driver specific things on the frontend. If they aren't a driver, only the "Apply"
	// tab will be shown.
	var driver driverEntities.DriverEntity
	driverCollection := db.Collection(datastores.Drivers)
	driverQuery := bson.D{{Key: "driver_uuid", Value: account.UserUUID}}
	err = driverCollection.FindOne(ctx, driverQuery).Decode(&driver)
	if err == nil {
		if driver.Verified != nil && *driver.Verified {
			defaultReturn["driver_verified"] = true
		} else {
			if driver.Applications != nil && len(driver.Applications) > 0 {
				defaultReturn["driver_applications"] = driver.Applications
			}
		}
	} else {
		if err != mongo.ErrNoDocuments {
			fmt.Println("Error fetching driver: ", err)
		}
	}

	dashboardStats := HydrateCards(account, *rider)
	defaultReturn["dashboard_stats"] = dashboardStats

	return util.JSONResponse(res, http.StatusOK, defaultReturn)
}

type DashboardStats struct {
	UpcomingTrips int `json:"upcoming_trips"`
	PastTrips int `json:"past_trips"`
	AccountType string `json:"account_type"`
}

func HydrateCards(account accountEntities.AccountEntity, rider riderEntities.RiderEntity) DashboardStats {

	var pastTrips []*tripEntities.TripEntity
	var upcomingTrips []*tripEntities.TripEntity

	db := datastores.GetMongoDatabase(context.Background())
	tripsCollection := db.Collection(datastores.Trips)

	// PAST TRIPS

	riderQuery := bson.D{
		{Key: "$or", Value: bson.A{
			bson.D{{Key: "riders.user_uuid", Value: *rider.RiderUUID}},
			bson.D{{Key: "assigned_driver.user_uuid", Value: *rider.RiderUUID}},
		}},
		{Key: "datetime", Value: bson.D{{Key: "$lte", Value: time.Now()}}},
	}

	cursor, err := tripsCollection.Find(context.Background(), riderQuery)
	if err != nil {
		fmt.Println("Error fetching trips with user: ", err)
	} else {
		err = cursor.All(context.Background(), &pastTrips)
		if err != nil {
			fmt.Println("Error decoding trips with user: ", err)
		}
	}

	// UPCOMING TRIPS

	riderQuery = bson.D{
		{Key: "$or", Value: bson.A{
			bson.D{{Key: "riders.user_uuid", Value: *rider.RiderUUID}},
			bson.D{{Key: "assigned_driver.user_uuid", Value: *rider.RiderUUID}},
		}},
		{Key: "datetime", Value: bson.D{{Key: "$gte", Value: time.Now()}}},
	}

	cursor, err = tripsCollection.Find(context.Background(), riderQuery)
	if err != nil {
		fmt.Println("Error fetching trips with user: ", err)
	} else {
		err = cursor.All(context.Background(), &upcomingTrips)
		if err != nil {
			fmt.Println("Error decoding trips with user: ", err)
		}
	}

	var driverEntity driverEntities.DriverEntity
	driverCollection := db.Collection(datastores.Drivers)
	driverQuery := bson.D{{Key: "driver_uuid", Value: *rider.RiderUUID}}
	err = driverCollection.FindOne(context.Background(), driverQuery).Decode(&driverEntity)
	if err != nil && err != mongo.ErrNoDocuments {
		fmt.Println("Error fetching driver: ", err)
	}

	if err != nil && err == mongo.ErrNoDocuments {
		return DashboardStats{
			UpcomingTrips: len(upcomingTrips),
			PastTrips: len(pastTrips),
			AccountType: "Rider",
		}
	}

	return DashboardStats{
		UpcomingTrips: len(upcomingTrips),
		PastTrips: len(pastTrips),
		AccountType: "Rider and Driver",
	}
}

func HydrateDashboard(account accountEntities.AccountEntity, rider riderEntities.RiderEntity) ([]*accountEntities.ReturnLoadInStatusCard, []*accountEntities.ReturnLoadInBottomAction) {

	statusCards := make([]*accountEntities.ReturnLoadInStatusCard, 0)
	bottomActions := make([]*accountEntities.ReturnLoadInBottomAction, 0)

	// Hydrate the status cards under "Recommended Actions in the dashboard".

	if rider.Address == nil {
		statusCards = append(statusCards, &accountEntities.ReturnLoadInStatusCard{
			Title: "Home Address",
			Description: "Add your home address to get started",
			Type: "danger",
			Action: "rider_add_address",
			ActionName: "Add Address",
			UUID: uuid.NewRandom().String(),
			DisplayType: "drawer",
		})
	}

	if account.TwoFAEnabled == nil || !*account.TwoFAEnabled {
		statusCards = append(statusCards, &accountEntities.ReturnLoadInStatusCard{
			Title: "Secure your account",
			Description: "Enable two-factor authentication for added security",
			Type: "warning",
			Action: "account_two_fa",
			ActionName: "Enable 2FA",
			UUID: uuid.NewRandom().String(),
			DisplayType: "drawer",
		})
	}

	if rider.Options == nil || rider.Options.PayFood == nil || rider.Options.PayGas == nil {
		statusCards = append(statusCards, &accountEntities.ReturnLoadInStatusCard{
			Title: "Ride Preferences",
			Description: "Set your ride preferences",
			Type: "default",
			Action: "rider_payment_preferences",
			ActionName: "Set Preferences",
			UUID: uuid.NewRandom().String(),
			DisplayType: "drawer",
		})
	}

	// Card 1: "Book your first trip"
	// Will be shown if user has no prior trip history
	// So we query the trip collection to see if the user has any trips
	var tripsWithUser []*tripEntities.TripEntity
	tripsCollection := datastores.GetMongoDatabase(context.Background()).Collection(datastores.Trips)

	riderQuery := bson.D{
		{Key: "riders.user_uuid", Value: *rider.RiderUUID},
	}

	cursor, err := tripsCollection.Find(context.Background(), riderQuery)
	if err != nil {
		fmt.Println("Error fetching trips with user: ", err)
	} else {
		err = cursor.All(context.Background(), &tripsWithUser)
		if err != nil {
			fmt.Println("Error decoding trips with user: ", err)
		}
	}

	if len(tripsWithUser) == 0 {
		bottomActions = append(bottomActions, &accountEntities.ReturnLoadInBottomAction{
			UUID: uuid.NewRandom().String(),
			Title: "Book your first trip",
			Description: "Get started by booking your first trip",
			Action: "book_trip",
			ActionName: "Book Trip",
			DisplayType: "card",
			Color: "green_gradient",
			DisplayBlob: "https://storage.googleapis.com/gatorpool-449522.appspot.com/travel.png",
		})
	}

	bottomActions = append(bottomActions, &accountEntities.ReturnLoadInBottomAction{
		UUID: uuid.NewRandom().String(),
		Title: "June Miami Getaway?",
		Description: "See fares to Miami for Spring Break",
		Action: "book_trip_flow",
		ActionName: "See Fares",
		FlowData: map[string]interface{}{
			"destination": "Miami, FL, US",
		},
		Color: "orange_gradient",
		DisplayType: "card",
		DisplayBlob: "https://storage.googleapis.com/gatorpool-449522.appspot.com/computer.png",
	})

	bottomActions = append(bottomActions, &accountEntities.ReturnLoadInBottomAction{
		UUID: uuid.NewRandom().String(),
		Title: "Anywhere in Florida",
		Description: "Go anywhere in Florida if drivers are available",
		Action: "book_trip",
		ActionName: "Book Trip",
		Color: "default",
		DisplayType: "card",
		DisplayBlob: "https://storage.googleapis.com/gatorpool-449522.appspot.com/map.png",
	})

	return statusCards, bottomActions
}