package entities

import (
	"time"
)

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