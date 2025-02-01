package util

import (
	"crypto/rand"
	"math/big"

	"code.gatorpool.internal/util/ptr"
)

func Generate6DigitCode() (*int64, error) {
	max := big.NewInt(899999)       // The maximum value for 6 digits (999999 - 100000)
	n, err := rand.Int(rand.Reader, max) // Generate a cryptographically secure random number
	if err != nil {
		return ptr.Int64(0), err
	}
	code := n.Int64() + 100000 // Add 100000 to ensure the result is 6 digits
	return ptr.Int64(code), nil
}

func Generate10DigitAlphanumericCode() (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	code := make([]byte, 10)
	for i := range code {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		code[i] = charset[n.Int64()]
	}
	return string(code), nil
}