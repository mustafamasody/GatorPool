package entities

import (
	"time"
)

type DispatchType string


type WarningEntity struct {
	WarningUUID		*string		`json:"warning_uuid,omitempty" bson:"warning_uuid,omitempty"`

	// The account that the warning is issued to
	UserUUID		*string		`json:"user_uuid,omitempty" bson:"user_uuid,omitempty"`

	// ban, warning
	Type			*string`json:"type,omitempty" bson:"type,omitempty"`

	// The number of points the warning is worth
	Points			*int		`json:"points,omitempty" bson:"points,omitempty"`

	// The datetime the warning was issued
	IssuedAt		*time.Time	`json:"issued_at,omitempty" bson:"issued_at,omitempty"`

	// The reason the warning was issued
	Reason			*string		`json:"reason,omitempty" bson:"reason,omitempty"`

	// The account that issued the warning
	IssuedBy		*string		`json:"issued_by,omitempty" bson:"issued_by,omitempty"`

	// The datetime the warning was resolved
	Resolved		*bool		`json:"resolved,omitempty" bson:"resolved,omitempty"`
	ResolvesAt		*time.Time	`json:"resolves_at,omitempty" bson:"resolves_at,omitempty"`
	ResolvedAt		*time.Time	`json:"resolved_at,omitempty" bson:"resolved_at,omitempty"`

	CreatedAt		*time.Time	`json:"created_at,omitempty" bson:"created_at,omitempty"`
	UpdatedAt		*time.Time	`json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}