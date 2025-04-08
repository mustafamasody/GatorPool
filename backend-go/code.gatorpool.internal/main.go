package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"code.gatorpool.internal/datastores/gcs"
	datastores "code.gatorpool.internal/datastores/mongo"
	"code.gatorpool.internal/guardian/secrets"
	"code.gatorpool.internal/guardian/session"
	"code.gatorpool.internal/util"
	"github.com/charmbracelet/log"
	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	accountHandler "code.gatorpool.internal/account/handler"
	"code.gatorpool.internal/account/oauth"
	configHandler "code.gatorpool.internal/config"
	driverHandler "code.gatorpool.internal/driver/handler"
	riderHandler "code.gatorpool.internal/rider/handler"
	tripHandler "code.gatorpool.internal/trip/handler"
)

func main() {

	// Initialize logger
	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    true,                  // Report the file name and line number
		ReportTimestamp: true,                  // Report the timestamp
		TimeFormat:      "2006-01-02 15:04:05", // Set the time format
		Prefix:          "SERVER",              // Set the prefix
	})

	// MARK: Load .env
	err := godotenv.Load(".env")
	if err != nil {
		panic(fmt.Errorf("error loading .env file: %w", err))
	}

	// MARK: Database URI
	uri := ""

	// Get the URI from GCP Secret Manager (unless environment is development)
	if os.Getenv("ENV") != "development" {
		logger.Info("Getting database secret...")
		uri, err = secrets.DatabaseSecret()
		if err != nil {
			logger.Error("Error getting database secret: " + err.Error())
		}
	} else {
		logger.Info("Using development database URI")
		uri = os.Getenv("DB_URI")
		// print the uri
		logger.Info("DB_URI: " + uri)
	}

	datastores.ConnectDB(uri)
	secrets.InitializeSecretCache()
	gcs.InitMediaHandler()

	r := chi.NewRouter()

	r.Use(util.JSONMiddleware)

	// Set up CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://gatorpool.netlify.app", "https://gatorpool-react-client.ue.r.appspot.com", "https://gatorpool-449522.ue.r.appspot.com", "https://api.gatorpool.app", "https://gatorpool.app", "https://www.gatorpool.app"}, // Allow your frontend origin
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-GatorPool-Username", "X-GatorPool-Device-Id", "*"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello, world!"))
	})

	r.Post("/oauth2/token", func(w http.ResponseWriter, r *http.Request) {
		oauth.OAuthToken(r, w, context.Background())
	})

	r.Post("/v1/auth/verify", func(w http.ResponseWriter, r *http.Request) {
		accountHandler.VerifyToken(r, w, context.Background())
	})

	// Account routes
	r.Route("/v1/account", func(r chi.Router) {
		r.Post("/auth/signup", func(w http.ResponseWriter, r *http.Request) {
			accountHandler.SignUpV1(r, w, context.Background())
		})
		r.Put("/auth/verify", func(w http.ResponseWriter, r *http.Request) {
			accountHandler.VerifyAccount(r, w, context.Background())
		})
		r.Post("/auth/finish", func(w http.ResponseWriter, r *http.Request) {
			accountHandler.FinishAccountV1(r, w, context.Background())
		})

		r.Post("/auth/password/reset/request", func(w http.ResponseWriter, r *http.Request) {
			accountHandler.RequestPasswordReset(r, w, context.Background())
		})
		r.Post("/auth/password/reset", func(w http.ResponseWriter, r *http.Request) {
			accountHandler.ResetPassword(r, w, context.Background())
		})
		r.Post("/auth/password/reset/code", func(w http.ResponseWriter, r *http.Request) {
			accountHandler.CheckCode(r, w, context.Background())
		})

		r.With(session.VerifyOAuthToken).Post("/loadin", func(w http.ResponseWriter, r *http.Request) {
			accountHandler.LoadIn(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/auth/2fa", func(w http.ResponseWriter, r *http.Request) {
			accountHandler.ToggleTwoFA(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/idp/pfp", func(w http.ResponseWriter, r *http.Request) {
			accountHandler.ChangeProfilePicture(r, w, r.Context())
		})
	})

	r.Route("/v1/rider", func(r chi.Router) {
		r.With(session.VerifyOAuthToken).Post("/address/save", func(w http.ResponseWriter, r *http.Request) {
			riderHandler.SaveAddress(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/preferences/save", func(w http.ResponseWriter, r *http.Request) {
			riderHandler.SetRidePreferences(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/queries", func(w http.ResponseWriter, r *http.Request) {
			riderHandler.GetRiderFlowQueries(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/gender", func(w http.ResponseWriter, r *http.Request) {
			riderHandler.GetRiderGender(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/trips", func(w http.ResponseWriter, r *http.Request) {
			riderHandler.GetTripsRiderFlow(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/trips/{trip_uuid}", func(w http.ResponseWriter, r *http.Request) {
			riderHandler.GetIndividualTrip(r, w, r.Context())
		})
	})

	r.Route("/v1/driver", func(r chi.Router) {
		r.With(session.VerifyOAuthToken).Post("/apply", func(w http.ResponseWriter, r *http.Request) {
			driverHandler.DriverApply(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/application/{application_uuid}", func(w http.ResponseWriter, r *http.Request) {
			driverHandler.GetIndividualApplication(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/gender", func(w http.ResponseWriter, r *http.Request) {
			driverHandler.GetDriverGender(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/trips", func(w http.ResponseWriter, r *http.Request) {
			driverHandler.GetPastTripsSummary(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/trips/{trip_uuid}", func(w http.ResponseWriter, r *http.Request) {
			driverHandler.GetIndividualTrip(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/fulfillment/dfcr", func(w http.ResponseWriter, r *http.Request) {
			driverHandler.CreateTripWarningCheck(r, w, r.Context())
		})
	})

	r.Route("/v1/trip", func(r chi.Router) {
		r.With(session.VerifyOAuthToken).Post("/", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.CreateTrip(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/rider/query", func(w http.ResponseWriter, r *http.Request) {
			riderHandler.QueryTrips(r, w, r.Context())
		})

		// r.With(session.VerifyOAuthToken).Get("/{trip_uuid}/rflow/driver", func(w http.ResponseWriter, r *http.Request) {
		// 	tripHandler.RiderFlowGetDriverDetails(r, w, r.Context())
		// })

		r.With(session.VerifyOAuthToken).Post("/{trip_uuid}/rider/request/remove", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.RiderFlowRemoveRequest(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Put("/{trip_uuid}", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.SaveTripSentBody(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Delete("/{trip_uuid}", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.CancelTripDriverFlow(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/rider/request", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.RiderRequestTrip(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/request/{trip_uuid}", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.DriverFlowRiderRequestTrip(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/{trip_uuid}/accept/{rider_uuid}", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.DriverFlowAcceptRiderRequest(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/{trip_uuid}/reject/{rider_uuid}", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.DriverFlowRejectRiderRequest(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/{trip_uuid}/remove/{rider_uuid}", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.DriverFlowRemoveRider(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/driver/feed", func(w http.ResponseWriter, r *http.Request) {
			driverHandler.QueryTripsFeed(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/{trip_uuid}/driver/request", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.RiderFlowDriverRequestTrip(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/{trip_uuid}/rflow/driver", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.RiderFlowGetDriverProfiles(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/{trip_uuid}/rider/request/accept/{driver_uuid}", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.RiderFlowRiderAcceptDriverRequest(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/{trip_uuid}/rider/driver/remove/{driver_uuid}", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.RiderFlowRiderRemoveDriver(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/{trip_uuid}/rider/request/reject/{driver_uuid}", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.RiderFlowRiderRejectDriverRequest(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/driver/trips/requested", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.RiderFlowDriverGetRequestedTrips(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/{trip_uuid}/driver/freeform/remove", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.RiderFlowDriverRemoveFromTripFreeform(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Get("/{trip_uuid}/riders", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.GetRidersInformation(r, w, r.Context())
		})
	})

	r.Route("/v1/config", func(r chi.Router) {
		r.With(session.VerifyOAuthToken).Get("/banner", func(w http.ResponseWriter, r *http.Request) {
			configHandler.GetBannerAnnouncement(r, w, r.Context())
		})
		r.With(session.VerifyOAuthToken).Get("/banner/close", func(w http.ResponseWriter, r *http.Request) {
			configHandler.CloseAnnouncement(r, w, r.Context())
		})
	})

	// MARK: Start Server
	logger.Info("Server started at http://" + os.Getenv("HOSTNAME") + ":8080")
	logger.Error(http.ListenAndServe(":8080", r).Error())

}