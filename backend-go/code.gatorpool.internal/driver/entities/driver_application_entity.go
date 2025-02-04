package entities

import (
	"time"
)

type DriverApplicationEntity struct {
	// Unique identifier for the driver application
	ApplicationUUID		*string						`json:"application_uuid" bson:"application_uuid"`

	// The driver's full name
	FullName			*string						`json:"full_name" bson:"full_name"`

	// The driver's email
	Email				*string						`json:"email" bson:"email"`

	// The driver's phone number
	PhoneNumber			*string						`json:"phone_number" bson:"phone_number"`

	// The driver's date of birth
	DateOfBirth 		*string						`json:"date_of_birth" bson:"date_of_birth"`

	// The driver's address
	Address				*string						`json:"address" bson:"address"`
	AddressLine2		*string						`json:"address_line_2" bson:"address_line_2"`
	City				*string						`json:"city" bson:"city"`
	State				*string						`json:"state" bson:"state"`
	ZipCode				*string						`json:"zip_code" bson:"zip_code"`

	Accepted			*bool						`json:"accepted" bson:"accepted"`
	AcceptedAt			*time.Time					`json:"accepted_at" bson:"accepted_at"`
	Message				*string						`json:"message" bson:"message"`
	Closed				*bool						`json:"closed" bson:"closed"`

	CreatedAt			*time.Time					`json:"created_at" bson:"created_at"`
	UpdateAt			*time.Time					`json:"updated_at" bson:"updated_at"`
}