package entities

type TripMiscellaneousEntity struct {
	Music				*TripMiscellaneousMusicOptionsEntity	`json:"music,omitempty" bson:"music"`
	AC					*TripMiscellaneousACOptionsEntity		`json:"ac,omitempty" bson:"ac"`
	Talking				*TripMiscellaneousTalkingOptionsEntity	`json:"talking,omitempty" bson:"talking"`
}

type TripMiscellaneousMusicOptionsEntity struct {
	CanBeControlled		*bool							`json:"can_be_controlled,omitempty" bson:"can_be_controlled"`
	Requests            map[string]interface{}			`json:"requests,omitempty" bson:"requests"`
}

type TripMiscellaneousACOptionsEntity struct {
	CanBeControlled		*bool							`json:"can_be_controlled,omitempty" bson:"can_be_controlled"`
	Requests			map[string]interface{}			`json:"requests,omitempty" bson:"requests"`
}

type TripMiscellaneousTalkingOptionsEntity struct {
	CanBeControlled		*bool							`json:"can_be_controlled,omitempty" bson:"can_be_controlled"`
	Requests			map[string]interface{}			`json:"requests,omitempty" bson:"requests"`
}