package entities

import (
	"time"
)

type VehicleEntity struct {
	// Unique identifier for the vehicle
	VehicleUUID			*string			`json:"vehicle_uuid" bson:"vehicle_uuid"`

	// The make of the vehicle
	Make				*string			`json:"make" bson:"make"`

	// The model of the vehicle
	Model				*string			`json:"model" bson:"model"`

	// The year the vehicle was made
	Year				*int			`json:"year" bson:"year"`

	// The color of the vehicle
	Color				*string			`json:"color" bson:"color"`

	// The license plate of the vehicle
	LicensePlate		*string			`json:"license_plate" bson:"license_plate"`

	// The state the vehicle is registered in
	State 				*string			`json:"state" bson:"state"`

	// The number of seats in the vehicle
	Seats				*int			`json:"seats" bson:"seats"`

	// The amount of luggage room in the vehicle
	Lugroom				*int			`json:"lugroom" bson:"lugroom"`

	CreatedAt 			*time.Time		`json:"created_at" bson:"created_at"`
}