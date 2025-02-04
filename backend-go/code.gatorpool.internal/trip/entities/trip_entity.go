package entities

import (
	"time"
)

type TripEntity struct {
	// Unique identifier for the trip
	TripUUID			*string							`json:"trip_uuid" bson:"trip_uuid"`
	
	// Waypoints for the trip (driver destination, rider pickup/dropoff)
	Waypoints			[]*WaypointEntity				`json:"waypoints" bson:"waypoints"`

	// The assigned driver for a trip, since riders can post ride requests
	AssignedDriver		*TripAssignedDriverEntity		`json:"assigned_driver" bson:"assigned_driver"`

	// The driver requests for a trip, since riders can post ride requests
	DriverRequests		[]*TripDriverRequestEntity		`json:"driver_requests" bson:"driver_requests"`

	// Posted by (UserUUID) for the trip
	PostedBy			*string							`json:"posted_by" bson:"posted_by"`

	// Can be driver, rider
	PostedByType		*string							`json:"posted_by_type" bson:"posted_by_type"`

	// FlowType: rider_requests_ride, driver_requests_riders, etc.
	// This is used to determine the flow of the trip and how to display it
	// Like if a person requests a ride, it will be displayed for drivers going to nearby locations
	FlowType			*string							`json:"flow_type" bson:"flow_type"`

	// Whether the trip is a carpool or not
	Carpool				*bool							`json:"carpool" bson:"carpool"`

	// The expected datetime of the trip
	Datetime			*time.Time						`json:"datetime" bson:"datetime"`

	// Current location of the driver, updated everytime driver loads page/does anything on the page
	CurrentLocation		*WaypointEntity					`json:"current_location" bson:"current_location"`

	// Riders for the trip
	Riders				[]*TripRiderEntity				`json:"riders" bson:"riders"`

	// The rider requirements set by the driver
	RiderRequirements 	*TripRiderRequirementsEntity	`json:"rider_requirements" bson:"rider_requirements"`

	// The trip status: (PENDING, ACTIVE, CANCELLED, COMPLETED)
	Status				*string							`json:"status" bson:"status"`

	// Fare for the trip (aggregated)
	Fare				*TripFareEntity					`json:"fare" bson:"fare"`

	// Conflicts, it stores the old values and new values. Can be destination change, etc.
	Conflicts 			[]*TripConflictEntity			`json:"conflicts" bson:"conflicts"`

	// Options like letting riders control music, ac, talking.
	Miscellaneous 		*TripMiscellaneousEntity		`json:"miscellaneous" bson:"miscellaneous"`

	// Fields for auditing
	CreatedAt			*time.Time						`json:"created_at" bson:"created_at"`
	UpdatedAt			*time.Time						`json:"updated_at" bson:"updated_at"`
}