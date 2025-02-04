package entities

import (
	"time"
)

/*

	Trip from UF Marston Library to:
		- Stop 1: Wynwood, Miami, FL
		- Stop 2: Miami Beach, Miami, FL

	- Driver: John
	- Rider: Jack
	- Rider 2: Jill

	- Waypoints:
		1:
			- Type: pickup
			- For: driver
			- Data: {anything, driver_uuid} <-- we probably wont be using this
			- Latitude: latitude of marston library (idk)
			- Longitude: longitude of marston library (idk)
			- Address: Marston Library, Gainesville, FL
			- Expected: 9:30am Pickup
			- Actual: 9:38am Pickup
		2:
			- Type: dropoff
			- For: rider
			- Data: {anything, rider_uuid} <-- we probably wont be using this
			- Latitude: latitude of wynwood, miami, fl (idk)
			- Longitude: longitude of wynwood, miami, fl (idk)
			- Address: Wynwood, Miami, FL
			- Expected: 2:00pm Dropoff
			- Actual: 2:28pm Dropoff
		3:
			- Type: dropoff
			- For: rider
			- Data: {anything, rider_uuid_2}
			- Latitude: latitude of miami beach, miami, fl (idk)
			- Longitude: longitude of miami beach, miami, fl (idk)
			- Address: Miami Beach, Miami, FL
			- Expected: 3:00pm Dropoff
			- Actual: 3:17pm Dropoff

*/

type WaypointEntity struct {
	// Type: Destination, Pickup, Stopover
	Type			*string					`json:"type" bson:"type"`

	// For: rider, driver, food, gas
	For 			*string					`json:"for" bson:"for"`

	// Data, optional data for the waypoint
	Data			map[string]interface{}	`json:"data" bson:"data"`

	// Latitude of the waypoint
	Latitude		*float64				`json:"latitude" bson:"latitude"`

	// Longitude of the waypoint
	Longitude		*float64				`json:"longitude" bson:"longitude"`

	// Geographical location of the waypoint
	Name			*string					`json:"name" bson:"name"`
	Address			*string					`json:"address" bson:"address"`
	Address2		*string					`json:"address2" bson:"address2"`
	City			*string					`json:"city" bson:"city"`
	State			*string					`json:"state" bson:"state"`
	Zip				*string					`json:"zip" bson:"zip"`

	// Expected time of arrival
	Expected 		*time.Time				`json:"expected" bson:"expected"`

	// Actual time of arrival
	Actual			*time.Time				`json:"actual" bson:"actual"`
}