/**
 * type RiderProfile struct {
	FirstName string `json:"first_name"`
	LastName string `json:"last_name"`
	ProfilePicture string `json:"profile_picture"`
	Phone string `json:"phone"`
	Email string `json:"email"`
	Gender string `json:"gender"`
	TripUUID string `json:"trip_uuid"`
	UserUUID string `json:"user_uuid"`
}
 */
export interface RiderProfile {
    first_name: string;
    last_name: string;
    profile_picture: string;
    phone: string;
    email: string;
    gender: string;
    trip_uuid: string;
    user_uuid: string;
}