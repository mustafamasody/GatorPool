package validator

import (
	"net/http"
	"regexp"

	"code.gatorpool.internal/util/ptr"
)

func ValidateInitializeSignUpRequest(req *http.Request) *bool {

	deviceID := req.Header.Get("X-Terratrade-Device-Id")
	email := req.Header.Get("X-Terratrade-Username")

	if deviceID == "" || email == "" {
		return ptr.Bool(false)
	}

	// Email regex
	reg := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !reg.MatchString(email) {
		return ptr.Bool(false)
	}

	return ptr.Bool(true)
}