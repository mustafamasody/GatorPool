package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	datastores "code.gatorpool.internal/datastores/mongo"
	"code.gatorpool.internal/guardian/secrets"
	"code.gatorpool.internal/guardian/session"
	"code.gatorpool.internal/util"
	"github.com/charmbracelet/log"
	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	accountHandler "code.gatorpool.internal/account/handler"
	riderHandler "code.gatorpool.internal/rider/handler"
	driverHandler "code.gatorpool.internal/driver/handler"
	configHandler "code.gatorpool.internal/config"
	tripHandler "code.gatorpool.internal/trip/handler"
	"code.gatorpool.internal/account/oauth"
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

	r := chi.NewRouter()

	r.Use(util.JSONMiddleware)

	// Set up CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://gatorpool.netlify.app"}, // Allow your frontend origin
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
	})

	r.Route("/v1/trip", func(r chi.Router) {
		r.With(session.VerifyOAuthToken).Post("/", func(w http.ResponseWriter, r *http.Request) {
			tripHandler.CreateTrip(r, w, r.Context())
		})

		r.With(session.VerifyOAuthToken).Post("/rider/query", func(w http.ResponseWriter, r *http.Request) {
			riderHandler.QueryTrips(r, w, r.Context())
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

// MARK: Scripts
// MARK: Setup
// Setup is a script that sets up the application, with dependencies and configurations
// To run, use `go run main.go setup`
func setup(environment string) error {

	// Set logger
	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    true,                  // Report the file name and line number
		ReportTimestamp: true,                  // Report the timestamp
		TimeFormat:      "2006-01-02 15:04:05", // Set the time format
		Prefix:          "SETUP",               // Set the prefix
	})

	// Check if the .env file exists, if not create it
	logger.Info("(2/5) Checking if .env file exists...")
	if _, err := os.Stat(".env"); os.IsNotExist(err) {

		// Create the .env file
		logger.Info("(3/5) .env file does not exist, creating .env file...")
		file, err := os.Create(".env")
		if err != nil {
			logger.Fatal(err)
		}
		defer file.Close()

		// Write the environment variables to the .env file
		logger.Info("(4/5) Writing environment variables to .env file...")
		file.WriteString("# .env\n\n")
		file.WriteString("# Environment\n")
		file.WriteString("ENV=" + environment + "\n")
		file.WriteString("HOSTNAME=localhost\n")
		file.WriteString("PORT=8080\n\n")		
		file.WriteString("# Database\n")
		file.WriteString("DB_URI=mongodb://<username>:<db_password>@gatorpool-main-cluster-shard-00-00.nnqaj.mongodb.net:27017,gatorpool-main-cluster-shard-00-01.nnqaj.mongodb.net:27017,gatorpool-main-cluster-shard-00-02.nnqaj.mongodb.net:27017/?ssl=true&replicaSet=atlas-w4mxqg-shard-0&authSource=admin&retryWrites=true&w=majority&appName=gatorpool-dev\n")
		file.WriteString("DB_USERNAME=<username>\n")
		file.WriteString("DB_PASSWORD=<password>\n\n")
		file.WriteString("# NOTE: Replace <username> and <password> with the actual username and password issued to you by the database administrator")

	} else {

		// Read the .env file
		envFile, err := os.ReadFile(".env")
		if err != nil {
			logger.Fatal(err)
		}

		// Split the .env file by new line
		envLines := strings.Split(string(envFile), "\n")

		// Check if the environment is production or staging
		logger.Info("(3/5) Checking if DB_URI is set correctly...")
		if environment == "production" || environment == "staging" {

			logger.Info("Setting up GCP Secret Manager...")

		} else {

			// Get DB_USERNAME and DB_PASSWORD from the environment
			DB_USERNAME := ""
			DB_PASSWORD := ""
			for i, line := range envLines {

				// Check if the line contains DB_USERNAME
				if strings.Contains(line, "DB_USERNAME") {

					// Get the DB_USERNAME
					DB_USERNAME = strings.Split(envLines[i], "=")[1]

				} else if strings.Contains(line, "DB_PASSWORD") {

					// Get the DB_PASSWORD
					DB_PASSWORD = strings.Split(envLines[i], "=")[1]

				}

			}

			// Loop through the .env file
			for i, line := range envLines {

				// Write the URI to the .env file
				if strings.Contains(line, "DB_URI") {
					envLines[i] = "DB_URI=mongodb://" + DB_USERNAME + ":" + DB_PASSWORD + "@gatorpool-main-cluster-shard-00-00.nnqaj.mongodb.net:27017,gatorpool-main-cluster-shard-00-01.nnqaj.mongodb.net:27017,gatorpool-main-cluster-shard-00-02.nnqaj.mongodb.net:27017/?ssl=true&replicaSet=atlas-w4mxqg-shard-0&authSource=admin&retryWrites=true&w=majority&appName=gatorpool-dev"
				}

			}

		}

		// Overriding the PORT and ENV based on the environment
		logger.Info("(4/5) Overriding PORT and ENV based on environment...")

		// Loop through the .env file
		for i, line := range envLines {
			if strings.Contains(line, "ENV") {

				// Change the ENV to the environment
				envLines[i] = "ENV=" + environment

			}

		}

		// Write the new .env file
		if environment != "production" {
			err = os.WriteFile(".env", []byte(strings.Join(envLines, "\n")), 0644)
			if err != nil {
				logger.Fatal(err)
			}
		}

	}

	// Return nil if no errors
	logger.Info("(5/5) Setup complete!")
	return nil

}