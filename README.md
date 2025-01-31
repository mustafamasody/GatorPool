

Installation Requirements:
- Download and install Go
- Download and install Nodejs (if you haven't)
- Download gcloud CLI
    - Once downloaded:
        - Run "gcloud auth login"
        - Run "gcloud auth application-default login"
- Download MongoDBCompass and add the Mongo URI as a saved connection 


To Run the React app:
- cd into "client"
- Run "npm install", if it gives you errors, run "npm install --legacy-peer-deps"
- Run "npm start"

To Run the Golang backend: 
- cd into "backend-go/code.gatorpool.internal"
- Run "go mod download" - if its your first time starting it up
- Run "go run main.go" (Make sure you're authenticated with gcloud CLI or it won't work!)