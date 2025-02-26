package entities

type RequestDriverApplyEntity struct {
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
	Year			*string		`json:"year" bson:"year"`
	Color			*string		`json:"color" bson:"color"`
	LicensePlate	*string		`json:"license_plate" bson:"license_plate"`
	LicenseState	*string		`json:"license_state" bson:"license_state"`
	Seats			*int		`json:"seats" bson:"seats"`
	Lugroom			*int		`json:"lugroom" bson:"lugroom"`
}