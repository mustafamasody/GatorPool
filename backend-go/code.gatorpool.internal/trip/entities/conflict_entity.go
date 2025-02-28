package entities

import (
	"time"
)

type TripConflictEntity struct {
	// Type of conflict: fare_changed, driver_cancelled, driver_changed, date_change, etc.
	Type				*string							`json:"type,omitempty" bson:"type"`

	// Timestamp of when the conflict was made
	ConflictAt			*time.Time						`json:"conflict_at,omitempty" bson:"conflict_at"`

	// Old values of the trip
	OldValues			map[string]interface{}			`json:"old_values,omitempty" bson:"old_values"`

	// New values of the trip
	ChangedValues		map[string]interface{}			`json:"changed_values,omitempty" bson:"changed_values"`
}