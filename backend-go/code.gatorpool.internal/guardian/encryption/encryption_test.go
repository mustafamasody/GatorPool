package encryption

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"sync"

	"os"
	"testing"

	"code.gatorpool.internal/guardian/secrets"
	"code.gatorpool.internal/util/ptr"

	"github.com/charmbracelet/log" // log is a simple logging package for Go

	"github.com/stretchr/testify/assert"
)

// MARK: TestGenerateKey
// TestGenerateKey tests the GenerateKey function
func TestGenerateKey(t *testing.T) {
	tests := []struct {
		name    string
		keyType string
	}{
		{"Symmetric Key", "symmetric"},
		{"Asymmetric Key", "asymmetric"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			key, err := GenerateKey(tt.keyType)
			assert.NoError(t, err)

			if tt.keyType == "symmetric" {
				assert.NotEmpty(t, key.(string))
				// t.Logf("Symmetric Key: \n%s", key)
			} else if tt.keyType == "asymmetric" {
				keyPair := key.(map[string]string)
				assert.NotEmpty(t, keyPair["publicKey"])
				assert.NotEmpty(t, keyPair["privateKey"])
				// t.Logf("Public Key: \n%s", keyPair["publicKey"])
				// t.Logf("Private Key: \n%s", keyPair["privateKey"])
			}
		})
	}
}

// MARK: TestEncryptDecryptData

const testOverridePublicKey = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3MFfxNMLdEODn8Sjc9hd
nAq3Irygewmaj3mucVRtetcN2nhWjvOGjqL9dBKr4myhqjGFfL0fuNKOoIU/64+Y
eEV78vncvqkIYJ/bfJ4wtGoQnVAcGkqFmnOc8hNn/miLKoEur84D4HBf/fIb//0y
UC76hwhF7ct/VH0KD7w1pYvnKGXBANwPtZetW8CPKTqUgux68nPWJYzv7fgqyXdG
0feBLqqCEk0TfywbRWmUjUspMuMAibNYotU1Wg8Vftc/i4arFi9AFdCz2HzgoNu+
hiI0p9vcejKMTAm86I4YtklRjTbRjtQPNfOAsF0mdHtKnHY4E3WiTIs46ss6wa7V
uwIDAQAB
-----END PUBLIC KEY-----
`
func TestEncryptDecryptData(t *testing.T) {

	secrets.PublicKey()
	secrets.PrivateKey()

	tests := []struct {
		name        string
		data        string
		overrideKey string
		expectError bool
		expected    string
		encryptVersion int32
	}{
		{"Encrypt and Decrypt with Default Key", "Hello, World!", "", false, "Hello, World!", int32(1)},
		{"Encrypt and Decrypt with Override Key", "Hello, World!", testOverridePublicKey, false, "Hello, World!", int32(1)},
		{"Encrypt with Invalid Override Key", "Hello, World!", "invalid_key", true, "", int32(1)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encryptedData, err := EncryptData(tt.data, tt.encryptVersion, tt.overrideKey)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotEmpty(t, encryptedData)

				decryptedData, err := DecryptData(encryptedData, tt.encryptVersion)
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, decryptedData)
			}
		})
	}
}

// MARK: TestSymmetricEncryption
func TestSymmetricEncryption(t *testing.T) {

	secrets.SymmetricKey() // Load the symmetric key for testing

	keyVersion := int32(1)

	// Encrypt data to get a valid encrypted hex string for decryption test
	encryptedData, err := SymmetricEncryption("Hello, World!", keyVersion, "encrypt")
	if err != nil {
		t.Fatalf("failed to encrypt data: %v", err)
	}

	tests := []struct {
		name          string
		data          string
		operationType string
		expectError   bool
		keyVersion    int32
	}{
		{"Symmetric Encrypt", "Hello, World!", "encrypt", false, keyVersion},
		{"Symmetric Decrypt", encryptedData, "decrypt", false, keyVersion},
		{"Invalid Operation Type", "Hello, World!", "invalid", true, keyVersion},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			result, err := SymmetricEncryption(tt.data, tt.keyVersion, tt.operationType)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				if tt.operationType == "decrypt" {
					assert.Equal(t, "Hello, World!", result)
				}
				assert.NoError(t, err)
				assert.NotEmpty(t, result)
			}
		})
	}
}



// MARK: TestJWTEncryption
func TestJWTEncryption(t *testing.T) {

	secrets.SymmetricKey() // Load the symmetric key for testing

	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller: true, // Report the file name and line number
		ReportTimestamp: true, // Report the timestamp
		TimeFormat: "2006-01-02 15:04:05", // Set the time format
		Prefix: "SYMMETRIC", // Set the prefix
	})

	version := int32(1)

	key, _ := secrets.GetSymmetricKeyWithVersion(version)

	logger.Info("Symmetric Key: %s", key)

	// Generate a random 16-byte IV
	ivBytes := make([]byte, aes.BlockSize)
	_, err := rand.Read(ivBytes)
	if err != nil {
		t.Fatalf("failed to generate IV: %v", err)
	}

	tests := []struct {
		name          string
		data          string
		operationType string
		expectError   bool
	}{
		{"Encrypt JWT", "example_jwt_token", "encrypt", false},
		{"Decrypt JWT", "example_jwt_token", "decrypt", false},
		{"Invalid Operation Type", "example_jwt_token", "invalid", true},
	}

	var encryptedData string

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.operationType == "encrypt" {
				result, err := JWTEncryption(tt.data, ivBytes, tt.operationType, &version)
				if tt.expectError {
					assert.Error(t, err)
				} else {
					assert.NoError(t, err)
					assert.NotEmpty(t, result.Token)
					encryptedData = result.Token
				}
			} else if tt.operationType == "decrypt" {
				// Use the previously encrypted data for decryption test
				ivBytesDecoded, _ := hex.DecodeString(hex.EncodeToString(ivBytes))
				result, err := JWTEncryption(encryptedData, ivBytesDecoded, tt.operationType, &version)
				if tt.expectError {
					assert.Error(t, err)
				} else {
					assert.NoError(t, err)
					assert.Equal(t, tt.data, result.Token)
				}
			} else {
				result, err := JWTEncryption(tt.data, ivBytes, tt.operationType, &version)
				if tt.expectError {
					assert.Error(t, err)
				} else {
					assert.NoError(t, err)
					assert.NotEmpty(t, result.Token)
				}
			}
		})
	}
}


// MARK: TestLocationEncryption
func TestLocationEncryption(t *testing.T) {
	// validKey := "0aa915235d82958197f1ebb1d916c75f"
	// iv := []byte("locationlocation")

	secrets.SymmetricKey() // Load the symmetric key for testing

	tests := []struct {
		name          string
		data          LocationData
		operationType string
		expectError   bool
		encryptVersion int32
	}{
		{"Encrypt Location", LocationData{Lat: "40.7128", Lng: "-74.0060", Version: "2"}, "encrypt", false, int32(1)},
		{"Decrypt Location", LocationData{Lat: "40.7128", Lng: "-74.0060", Version: "2"}, "decrypt", false, int32(1)},
		{"Invalid Operation Type", LocationData{Lat: "40.7128", Lng: "-74.0060", Version: "1.0.0"}, "invalid", true, int32(1)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.operationType == "encrypt" {
				encryptedData, err := LocationEncryption(tt.data, ptr.Int32(tt.encryptVersion), tt.operationType)
				if tt.expectError {
					assert.Error(t, err)
				} else {
					assert.NoError(t, err)
					fmt.Println("ENCRYPTED LOCATION: ", encryptedData)
					assert.NotEmpty(t, encryptedData)
				}
			} else if tt.operationType == "decrypt" {
				encryptedData, err := LocationEncryption(tt.data, ptr.Int32(tt.encryptVersion), "encrypt")
				assert.NoError(t, err)

				decryptedData, err := LocationEncryption(encryptedData, ptr.Int32(tt.encryptVersion), tt.operationType)
				if tt.expectError {
					assert.Error(t, err)
				} else {
					assert.NoError(t, err)
					assert.Equal(t, tt.data.Lat, decryptedData.Lat)
					assert.Equal(t, tt.data.Lng, decryptedData.Lng)
				}
			} else {
				_, err := LocationEncryption(tt.data, ptr.Int32(tt.encryptVersion), tt.operationType)
				assert.Error(t, err)
			}
		})
	}
}

// MARK: TestEncryptLocation
func TestEncryptLocation(t *testing.T) {
	key := "0aa915235d82958197f1ebb1d916c75f"
	iv := []byte("locationlocation")

	tests := []struct {
		name        string
		plainText   string
		key         string
		expectError bool
	}{
		{"Valid Encryption", "40.7128", key, false},
		{"Invalid Key Size", "40.7128", "shortkey", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encryptedText, err := encryptLocation(tt.plainText, tt.key, iv)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotEmpty(t, encryptedText)
			}
		})
	}
}

// MARK: TestDecryptLocation
func TestDecryptLocation(t *testing.T) {
	key := "0aa915235d82958197f1ebb1d916c75f"
	iv := []byte("locationlocation")

	plainText := "40.7128"
	cipherText, err := encryptLocation(plainText, key, iv)
	assert.NoError(t, err)

	tests := []struct {
		name        string
		cipherText  string
		key         string
		expectError bool
	}{
		{"Valid Decryption", cipherText, key, false},
		{"Invalid Cipher Text", "invalid_cipher", key, true},
		{"Invalid Key Size", cipherText, "shortkey", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			decryptedText, err := decryptLocation(tt.cipherText, tt.key, iv)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, plainText, decryptedText)
			}
		})
	}
}

// TestEmailVerification tests the EmailVerification function
func TestEncryptDecryptEmailVerificationData(t *testing.T) {
	tests := []struct {
		name        string
		data        EmailVerificationData
		expectError bool
	}{
		{
			name: "Encrypt and Decrypt",
			data: EmailVerificationData{
				ObjectID: "123456",
				Email:    "example@example.com",
				Code:     "ABC123",
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Encrypt the data
			err := EncryptEmailVerificationData(&tt.data)
			assert.NoError(t, err)
			assert.NotEmpty(t, tt.data.EncryptedObjectID)
			assert.NotEmpty(t, tt.data.EncryptedEmail)
			assert.NotEmpty(t, tt.data.EncryptedCode)

			// Decrypt the data
			err = DecryptEmailVerificationData(&tt.data)
			assert.NoError(t, err)
			assert.Equal(t, "123456", tt.data.ObjectID)
			assert.Equal(t, "example@example.com", tt.data.Email)
			assert.Equal(t, "ABC123", tt.data.Code)
		})
	}
}

func BenchmarkAesGcm(b *testing.B) {
    key := make([]byte, 32) // 256-bit key
    _, _ = rand.Read(key)
    data := make([]byte, 1024) // 1 KB of data
    _, _ = rand.Read(data)

    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        block, _ := aes.NewCipher(key)
        gcm, _ := cipher.NewGCM(block)
        nonce := make([]byte, gcm.NonceSize())
        _, _ = io.ReadFull(rand.Reader, nonce)
        gcm.Seal(nonce, nonce, data, nil)
    }
}

func BenchmarkPooledAesCfb(b *testing.B) {
    key := make([]byte, 32) // 256-bit key
    _, _ = rand.Read(key)
    data := make([]byte, 1024) // 1 KB of data
    _, _ = rand.Read(data)

    pool := &sync.Pool{
        New: func() interface{} {
            block, _ := aes.NewCipher(key)
            return block
        },
    }

    iv := make([]byte, aes.BlockSize)
    _, _ = rand.Read(iv)

    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        block := pool.Get().(cipher.Block)
        stream := cipher.NewCFBEncrypter(block, iv)
        stream.XORKeyStream(data, data)
        pool.Put(block)
    }
}