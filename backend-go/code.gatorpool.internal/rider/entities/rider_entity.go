package entities

import (
	tripEntities "code.gatorpool.internal/trip/entities"
)

type RiderEntity struct {
	// Unique identifier for the rider
	RiderUUID			*string					`json:"rider_uuid" bson:"rider_uuid"`

	// An array of trip_uuids
	PastTrips			[]*string				`json:"past_trips" bson:"past_trips"`

	// Average rating of the rider given by drivers
	Rating				*float64				`json:"rating" bson:"rating"`

	Options 			*RiderOptionsEntity		`json:"options" bson:"options"`

	// The amount of rides the rider has taken/cancelled
	Fulfillment			*RiderFulfillmentEntity	`json:"fulfillment" bson:"fulfillment"`

	// Disceplanary actions taken/reported against the rider
	Disceplanary		*RiderDisceplanaryEntity	`json:"disceplanary" bson:"disceplanary"`

	Address				*tripEntities.WaypointEntity `json:"address" bson:"address"`

	Queries				[]*RiderQueryEntity		`json:"queries" bson:"queries"`
}

type RiderOptionsEntity struct {
	PayGas				*bool					`json:"pay_gas" bson:"pay_gas"`
	PayFood				*bool					`json:"pay_food" bson:"pay_food"`
}

type RiderFulfillmentEntity struct {
	// The amount of rides the rider has backed out of
	BackedOut 			*int64					`json:"backed_out" bson:"backed_out"`
}

type RiderDisceplanaryEntity struct {
	Warnings			[]*string				`json:"warnings" bson:"warnings"`
	Bans				[]*string				`json:"bans" bson:"bans"`
	Complaints			[]*string				`json:"complaints" bson:"complaints"`
}