package entities

/*
	Example:

	- UF Lib West to Temple Terrace, FL
	- Cost for gas set by driver: $20 - Gas field
	- Cost for food set by driver: $10 - Food field
	- Cost for trip set by driver: $30 - Trip field
	- Total cost: $60 -> Aggregated field
*/

type TripFareEntity struct {
	// Total aggregated cost of the trip set by the driver
	Aggregated			*float64						`json:"aggregated,omitempty" bson:"aggregated"`
	Gas					*float64						`json:"gas,omitempty" bson:"gas"`
	Trip 				*float64						`json:"trip,omitempty" bson:"trip"`
	Food				*float64						`json:"food,omitempty" bson:"food"`
}