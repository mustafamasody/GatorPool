package entities

type TripMiscellaneousEntity struct {
	Music				*TripMiscellaneousMusicOptionsEntity	`json:"music,omitempty" bson:"music,omitempty"`
	AC					*TripMiscellaneousACOptionsEntity		`json:"ac,omitempty" bson:"ac,omitempty"`
	Talking				*TripMiscellaneousTalkingOptionsEntity	`json:"talking,omitempty" bson:"talking,omitempty"`
}

type TripMiscellaneousMusicOptionsEntity struct {
	CanBeControlled		*bool							`json:"can_be_controlled,omitempty" bson:"can_be_controlled,omitempty"`
	Requests            map[string]interface{}			`json:"requests,omitempty" bson:"requests,omitempty"`
}

type TripMiscellaneousACOptionsEntity struct {
	CanBeControlled		*bool							`json:"can_be_controlled,omitempty" bson:"can_be_controlled,omitempty"`
	Requests			map[string]interface{}			`json:"requests,omitempty" bson:"requests,omitempty"`
}

type TripMiscellaneousTalkingOptionsEntity struct {
	CanBeControlled		*bool							`json:"can_be_controlled,omitempty" bson:"can_be_controlled,omitempty"`
	Type				*string							`json:"type,omitempty" bson:"type,omitempty"`
	Requests			map[string]interface{}			`json:"requests,omitempty" bson:"requests,omitempty"`
}