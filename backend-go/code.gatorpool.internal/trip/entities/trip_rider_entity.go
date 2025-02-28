package entities

import (
	"time"
)

type TripRiderEntity struct {
	// The UserUUID of the rider who requested the trip/going on the trip
	UserUUID			*string							`json:"user_uuid,omitempty" bson:"user_uuid"`

	// The address of where the rider is headed to
	Address				*WaypointEntity					`json:"address,omitempty" bson:"address"`

	// Whether the rider has been accepted by the driver
	Accepted			*bool							`json:"accepted,omitempty" bson:"accepted"`

	// Timestamp of when the rider was accepted by the driver
	AcceptedAt			*time.Time						`json:"accepted_at,omitempty" bson:"accepted_at"`

	// The rating given to the driver by the rider
	Rating				*float64						`json:"rating,omitempty" bson:"rating"`

	// The review given to the driver by the rider
	Review				*string							`json:"review,omitempty" bson:"review"`

	// What the rider is willing to pay for
	Willing 			*TripRiderWillingEntity			`json:"willing,omitempty" bson:"willing"`
}

type TripRiderWillingEntity struct {
	PayFood				*bool							`json:"pay_food,omitempty" bson:"pay_food"`
	PayGas				*bool							`json:"pay_gas,omitempty" bson:"pay_gas"`
	Custom 				map[string]interface{}			`json:"custom,omitempty" bson:"custom"`
}

type TripRiderRequirementsEntity struct {
	PayFood				*bool							`json:"pay_food,omitempty" bson:"pay_food"`
	PayGas				*bool							`json:"pay_gas,omitempty" bson:"pay_gas"`
	Custom 				map[string]interface{}			`json:"custom,omitempty" bson:"custom"`
}