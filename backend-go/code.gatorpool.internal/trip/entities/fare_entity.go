package entities

type TripFareEntity struct {
	// Total aggregated cost of the trip set by the driver
	Aggregated			*float64						`json:"aggregated" bson:"aggregated"`
	Gas					*float64						`json:"gas" bson:"gas"`
	Trip 				*float64						`json:"trip" bson:"trip"`
	Food				*float64						`json:"food" bson:"food"`
}