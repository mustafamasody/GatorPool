package entities

import (
	"time"
)

/*
	Current way we planned this: 
	- Drivers post where they're driving to, and then riders request to ride with them

	Now, we have 2 ways:
	1) Traditional way of driver posting where they're headed, offering riders to ride with them 
	2) Riders can post ride requests, and drivers can request that ride to drive.
*/

type TripDriverRequestEntity struct {
	// The UserUUID of the driver who requested the trip
	UserUUID			*string							`json:"user_uuid" bson:"user_uuid"`

	// Where the driver is headed to
	Address				*WaypointEntity					`json:"address" bson:"address"`

	// Timestamp of when the driver requested the trip
	RequestedAt			*time.Time						`json:"requested_at" bson:"requested_at"`
}

type TripAssignedDriverEntity struct {
	// The UserUUID of the driver who is assigned to the trip
	UserUUID			*string							`json:"user_uuid" bson:"user_uuid"`

	// Where the driver is headed to
	Address				*WaypointEntity					`json:"address" bson:"address"`

	// Timestamp of when the driver was assigned to the trip
	AssignedAt			*time.Time						`json:"assigned_at" bson:"assigned_at"`
}