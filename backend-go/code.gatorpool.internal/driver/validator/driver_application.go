package validator

import (
	"errors"
	"time"

	driverEntities "code.gatorpool.internal/driver/entities"
)

/*
	FirstName		*string		`json:"first_name" bson:"first_name"`
	LastName		*string		`json:"last_name" bson:"last_name"`
	Email			*string		`json:"email" bson:"email"`
	Phone			*string		`json:"phone" bson:"phone"`
	DOB				*string		`json:"dob" bson:"dob"`
	Address			*string		`json:"address" bson:"address"`
	AddressLine2	*string		`json:"address_line2" bson:"address_line2"`
	City			*string		`json:"city" bson:"city"`
	State			*string		`json:"state" bson:"state"`
	Zip				*string		`json:"zip" bson:"zip"`
	Make			*string		`json:"make" bson:"make"`
	Model			*string		`json:"model" bson:"model"`
	Year			*int		`json:"year" bson:"year"`
	Color			*string		`json:"color" bson:"color"`
	LicensePlate	*string		`json:"license_plate" bson:"license_plate"`
	LicenseState	*string		`json:"license_state" bson:"license_state"`
	Seats			*int		`json:"seats" bson:"seats"`
	Lugroom			*int		`json:"lugroom" bson:"lugroom"`
*/

func ValidateRequestDriverApply(request *driverEntities.RequestDriverApplyEntity) error {

	if request.FirstName == nil {
		return errors.New("first name is required")
	}

	if request.LastName == nil {
		return errors.New("last name is required")
	}

	if request.Email == nil {
		return errors.New("email is required")
	}

	if request.Phone == nil {
		return errors.New("phone is required")
	}

	if request.DOB == nil {
		return errors.New("dob is required")
	}

	if request.Address == nil {
		return errors.New("address is required")
	}

	if request.City == nil {
		return errors.New("city is required")
	}

	if request.State == nil {
		return errors.New("state is required")
	}

	if request.Zip == nil {
		return errors.New("zip is required")
	}

	if request.Make == nil {
		return errors.New("make is required")
	}

	if request.Model == nil {
		return errors.New("model is required")
	}

	if request.Year == nil {
		return errors.New("year is required")
	}

	if request.Color == nil {
		return errors.New("color is required")
	}

	if request.LicensePlate == nil {
		return errors.New("license plate is required")
	}

	if request.LicenseState == nil {
		return errors.New("license state is required")
	}

	if request.Seats == nil {
		return errors.New("seats is required")
	}

	if request.Lugroom == nil {
		return errors.New("lugroom is required")
	}

	// Parse DOB as (yyyy-mm-dd)
	if _, err := time.Parse("2006-01-02", *request.DOB); err != nil {
		return errors.New("dob is invalid")
	}

	return nil
}