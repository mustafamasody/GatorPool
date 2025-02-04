package entities

import (
	"time"
)

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