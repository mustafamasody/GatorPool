package entities

type TripMiscellaneousEntity struct {
	Music				*TripMiscellaneousMusicOptionsEntity	`json:"music" bson:"music"`
	AC					*TripMiscellaneousACOptionsEntity		`json:"ac" bson:"ac"`
	Talking				*TripMiscellaneousTalkingOptionsEntity	`json:"talking" bson:"talking"`
}

type TripMiscellaneousMusicOptionsEntity struct {
	CanBeControlled		*bool							`json:"can_be_controlled" bson:"can_be_controlled"`
	Requests            map[string]interface{}			`json:"requests" bson:"requests"`
}

type TripMiscellaneousACOptionsEntity struct {
	CanBeControlled		*bool							`json:"can_be_controlled" bson:"can_be_controlled"`
	Requests			map[string]interface{}			`json:"requests" bson:"requests"`
}

type TripMiscellaneousTalkingOptionsEntity struct {
	CanBeControlled		*bool							`json:"can_be_controlled" bson:"can_be_controlled"`
	Requests			map[string]interface{}			`json:"requests" bson:"requests"`
}