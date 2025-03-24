package entities

import (
	"time"

	tripEntities "code.gatorpool.internal/trip/entities"
)

type RiderQueryEntity struct {
	QueryUUID			*string							`json:"query_uuid,omitempty" bson:"query_uuid,omitempty"`
	From				*tripEntities.WaypointEntity	`json:"from,omitempty" bson:"from,omitempty"`
	To					*tripEntities.WaypointEntity	`json:"to,omitempty" bson:"to,omitempty"`
	Date				*time.Time						`json:"date,omitempty" bson:"date,omitempty"`
	LastQueried			*time.Time						`json:"last_queried,omitempty" bson:"last_queried,omitempty"`
}
