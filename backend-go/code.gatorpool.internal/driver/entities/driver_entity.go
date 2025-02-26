package entities

import (
	"time"
)

type DriverEntity struct {
	// Unique identifier for the driver
	DriverUUID			*string						`json:"driver_uuid" bson:"driver_uuid"`

	// An array of trip_uuids
	PastTrips			[]*string					`json:"past_trips" bson:"past_trips"`

	// The average rating of the driver given by riders
	Rating				*float64					`json:"rating" bson:"rating"`

	// Any ongoing or past warnings/bans/complaints, etc.
	Disceplanary 		*DriverDisceplanaryEntity	`json:"disceplanary" bson:"disceplanary"`

	// Their driver applications
	Applications		[]*DriverApplicationEntity	`json:"applications" bson:"applications"`

	// Their vehicles
	Vehicles			[]*VehicleEntity			`json:"vehicles" bson:"vehicles"`

	// Whether the driver is verified or not
	Verified			*bool						`json:"verified" bson:"verified"`

	// The datetime the driver was verified
	VerifiedAt			*time.Time					`json:"verified_at" bson:"verified_at"`

	CreatedAt			*time.Time					`json:"created_at" bson:"created_at"`
	UpdatedAt			*time.Time					`json:"updated_at" bson:"updated_at"`
}

type DriverDisceplanaryEntity struct {
	Warnings			[]*string					`json:"warnings" bson:"warnings"`
	Bans				[]*string					`json:"bans" bson:"bans"`
	Complaints			[]*string					`json:"complaints" bson:"complaints"`
}