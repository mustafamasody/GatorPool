

Installation Requirements:
- Download and install Go
- Once installed, relaunch VSCode
- Download and install Nodejs (if you haven't)
- Once installed, relaunch VSCode
- Download gcloud CLI
    - Once downloaded:
        - gcloud will prompt you to login, click the same email you used to be invited to the Google Cloud!
        - Relaunch VSCode after you login (YOU MUST)
- Download MongoDBCompass and install it

Create a file in backend-go/code.gatorpool.internal called ".env" and paste this:

START .ENV (dont copy this)
# .env

# Environment
ENV=development
HOSTNAME=localhost
PORT=8080

# Database
DB_URI=mongodb://<username>:<password>@gatorpool-main-cluster-shard-00-00.nnqaj.mongodb.net:27017,gatorpool-main-cluster-shard-00-01.nnqaj.mongodb.net:27017,gatorpool-main-cluster-shard-00-02.nnqaj.mongodb.net:27017/?ssl=true&replicaSet=atlas-w4mxqg-shard-0&authSource=admin&retryWrites=true&w=majority&appName=gatorpool-dev
DB_USERNAME=<username>
DB_PASSWORD=<password>
# NOTE: Replace <username> and <password> with the actual username and password issued to you by Mustafa in the discord
END .ENV (dont copy this)

**REMEMBER TO REPLACE USERNAME AND PASSWORD, LOOK AT DISCORD FOR YOUR CREDENTIALS**

After you replace it, copy the "DB_URI" field and add it as a saved connection in MongoDBCompass, so that way you can launch MongoDBCompass anytime and inspect/change the database!

Now:
Run "gcloud config set project gatorpool-449522" in vscode terminal 

Now, you can run the backend and frontend!

To Run the Golang backend: 
- cd into "backend-go/code.gatorpool.internal"
- Run "go run main.go" (Make sure you're authenticated with gcloud CLI or it won't work!)

To Run the React app:
- cd into "client"
- Run "npm install", if it gives you errors, run "npm install --legacy-peer-deps"
- Run "npm start"