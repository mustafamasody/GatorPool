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
	Type			*string					`json:"type,omitempty" bson:"type,omitempty"`

	// For: rider, driver, food, gas
	For 			*string					`json:"for,omitempty" bson:"for,omitempty"`

	// Data, optional data for the waypoint
	Data			map[string]interface{}	`json:"data,omitempty" bson:"data,omitempty"`

	// Latitude of the waypoint
	Latitude		*float64				`json:"latitude,omitempty" bson:"latitude,omitempty"`

	// Longitude of the waypoint
	Longitude		*float64				`json:"longitude,omitempty" bson:"longitude,omitempty"`

	// Geographical location of the waypoint
	Name			*string					`json:"name,omitempty" bson:"name,omitempty"`
	Address			*string					`json:"address,omitempty" bson:"address,omitempty"`
	Address2		*string					`json:"address2,omitempty" bson:"address2,omitempty"`
	City			*string					`json:"city,omitempty" bson:"city,omitempty"`
	State			*string					`json:"state,omitempty" bson:"state,omitempty"`
	Zip				*string					`json:"zip,omitempty" bson:"zip,omitempty"`
	GeoText			*string					`json:"geo_text,omitempty" bson:"geo_text,omitempty"`

	// Expected time of arrival
	Expected 		*time.Time				`json:"expected,omitempty" bson:"expected,omitempty"`

	// Actual time of arrival
	Actual			*time.Time				`json:"actual,omitempty" bson:"actual,omitempty"`
}