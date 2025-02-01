package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MFAEntity struct {
	ID            		primitive.ObjectID 			`json:"_id" bson:"_id"`
	UserUUID			*string             		`json:"user_uuid" bson:"user_uuid"`
	Code				*int64	             		`json:"code" bson:"code"`
	Email				*string             		`json:"email" bson:"email"`
	DeviceID			*string             		`json:"device_id" bson:"device_id"`
	AttemptsLeft		*int64	             		`json:"attempts_left" bson:"attempts_left"`
	ExpiresAt           *time.Time          		`json:"expires_at" bson:"expires_at"`
	CreatedAt           *time.Time          		`json:"created_at" bson:"created_at"`
}