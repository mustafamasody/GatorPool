package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AccountEntity struct {
	ID					primitive.ObjectID 		`json:"_id,omitempty" bson:"_id,omitempty"`
	UserUUID			*string 				`json:"user_uuid,omitempty" bson:"user_uuid,omitempty"`
	IsVerified			*bool 					`json:"is_verified,omitempty" bson:"is_verified,omitempty"`
	IsComplete  		*bool 					`json:"is_complete,omitempty" bson:"is_complete,omitempty"`

	Password			*Password 				`json:"password,omitempty" bson:"password,omitempty"`

	ProfilePicture 		*bool 					`json:"profile_picture,omitempty" bson:"profile_picture,omitempty"`
	ProfilePictureObj 	*ProfilePicture 		`json:"profile_picture_obj,omitempty" bson:"profile_picture_obj,omitempty"`

	AnnouncementVersion *int64 					`json:"announcement_version" bson:"announcement_version"`

	TwoFAEnabled		*bool 					`json:"two_fa_enabled,omitempty" bson:"two_fa_enabled,omitempty"`
	TwoFARequests     []*TwoFARequest      `json:"two_fa_requests" bson:"two_fa_requests"`
	Gender  			*string 				`json:"gender" bson:"gender"`
	Sessions			[]*Session 				`json:"sessions,omitempty" bson:"sessions,omitempty"`
	LastLogin           *time.Time 				`json:"last_login,omitempty" bson:"last_login,omitempty"`
	LastLogout          *time.Time 				`json:"last_logout,omitempty" bson:"last_logout,omitempty"`
	OnboardingStatus 	*OnboardingStatus 		`json:"onboarding_status" bson:"onboarding_status"`
	FirstName   		*string 				`json:"first_name,omitempty" bson:"first_name,omitempty"`
	LastName   			*string 				`json:"last_name,omitempty" bson:"last_name,omitempty"`
	UFID				*string 				`json:"ufid,omitempty" bson:"ufid,omitempty"`
	Email				*string 				`json:"email,omitempty" bson:"email,omitempty"`
	AboutMe				*string 				`json:"aboutme,omitempty" bson:"aboutme,omitempty"`
	Phone				*string 				`json:"phone,omitempty" bson:"phone,omitempty"`
	RiderUUID			*string 				`json:"rider_uuid,omitempty" bson:"rider_uuid,omitempty"`
	DriverUUID			*string 				`json:"driver_uuid,omitempty" bson:"driver_uuid,omitempty"`
	CreatedAt   		*time.Time 				`json:"created_at,omitempty" bson:"created_at,omitempty"`
	UpdatedAt   		*time.Time 				`json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}

type ProfilePicture struct {
	ImageGCSPath     *string `json:"image_gcs_path" bson:"image_gcs_path"`
	ImageURL         *string `json:"image_url" bson:"image_url"`
	ImageURLExpiryAt *int64  `json:"image_url_expiry_at" bson:"image_url_expiry_at"`
}

type OnboardingStatus struct {
	State			*string			`json:"state" bson:"state"`
	Step			*int64			`json:"step" bson:"step"`
	Responses       map[string]interface{} `json:"responses" bson:"responses"`
}

type Password struct {
	Hash 				*string 				`json:"hash,omitempty" bson:"hash,omitempty"`
	EncryptedVersion	*int64 					`json:"encrypted_version,omitempty" bson:"encrypted_version,omitempty"`
}

type Session struct {
	DeviceUUID			*string 				`json:"device_uuid,omitempty" bson:"device_uuid,omitempty"`
	Token				*string 				`json:"token,omitempty" bson:"token,omitempty"`
	RefreshToken		*string 				`json:"refresh_token,omitempty" bson:"refresh_token,omitempty"`
	RefreshIssuedAt		*time.Time 				`json:"refresh_issued_at,omitempty" bson:"refresh_issued_at,omitempty"`
	TokenID				*string 				`json:"token_id,omitempty" bson:"token_id,omitempty"`
	IssuedAt			*time.Time 				`json:"issued_at,omitempty" bson:"issued_at,omitempty"`
	LastLoginAt			*time.Time 				`json:"last_login_at,omitempty" bson:"last_login_at,omitempty"`
	UserAgent			*string 				`json:"user_agent,omitempty" bson:"user_agent,omitempty"`
	IPAddress			*string 				`json:"ip_address,omitempty" bson:"ip_address,omitempty"`
	Web 				*bool 					`json:"web,omitempty" bson:"web,omitempty"`
	EncryptedVersion    *int64 					`json:"encrypted_version,omitempty" bson:"encrypted_version,omitempty"`
	EncryptedVersions 	*EncryptedVersions 		`json:"encrypted_versions" bson:"encrypted_versions"`
}

// MARK: EncryptedVersion struct
type EncryptedVersions struct {
	SymmetricVersion  *int64 `json:"symmetric_version" bson:"symmetric_version"`
	AsymmetricVersion *int64 `json:"asymmetric_version" bson:"asymmetric_version"`
}

type TwoFARequest struct {
	RequestID         *string 				`json:"request_id" bson:"request_id"`
	FlowType		  *string 				`json:"flow_type" bson:"flow_type"`
	FlowStatus		  *string 				`json:"flow_status" bson:"flow_status"`
	FlowData		  *string 				`json:"flow_data" bson:"flow_data"`
	StateChanges	  []*TwoFAStateChange 	`json:"state_changes" bson:"state_changes"`
	DeleteTimer		  *bool 				`json:"delete_timer" bson:"delete_timer"`
	CreatedAt		  *time.Time 			`json:"created_at" bson:"created_at"`
	UpdatedAt		  *time.Time 			`json:"updated_at" bson:"updated_at"`
}

type TwoFAStateChange struct {
	State			  *string 				`json:"state" bson:"state"`
	ChangedAt		  *time.Time 			`json:"changed_at" bson:"changed_at"`
}