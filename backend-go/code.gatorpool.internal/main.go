package main

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	datastores "code.gatorpool.internal/datastores/mongo"
	"code.gatorpool.internal/guardian/secrets"
	"github.com/charmbracelet/log"
	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
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

	// Set up CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://gatorpool.netlify.app"}, // Allow your frontend origin
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Terratrade-Username", "X-Terratrade-Device-Id", "*", "tt-token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello, world!"))
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