package secrets

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"

	secretmanager "cloud.google.com/go/secretmanager/apiv1"
	"cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
	"github.com/charmbracelet/log" // log is a simple logging package for Go
	"google.golang.org/api/iterator"
)

// MARK: Secret Cache
var DatabaseSecretValue string
var MediaHandlerSecretValue string

var PublicKeyValue string
var PublicKeyVersions map[string]map[int32]string = make(map[string]map[int32]string)
var PublicKeyValueLatestVersion int32

var PrivateKeyValue string
var PrivateKeyVersions map[string]map[int32]string = make(map[string]map[int32]string)
var PrivateKeyValueLatestVersion int32

var SymmetricKeyValue string
var SymmetricKeyVersions map[string]map[int32]string = make(map[string]map[int32]string)
var SymmetricKeyValueLatestVersion int32

var EmailSecretValue string

var SecretsWithVersions = map[string][]int32{
}

func InitializeSecretCache() {
    // Create a new logger
    logger := log.NewWithOptions(os.Stderr, log.Options{
        ReportCaller:    true, // Report the file name and line number
        ReportTimestamp: true, // Report the timestamp
        TimeFormat:      "2006-01-02 15:04:05", // Set the time format
        Prefix:          "SECRET", // Set the prefix
    })

    var err error
    {
        DatabaseSecretValue, err = DatabaseSecret()
        if err != nil {
            logger.Fatal(err)
        }
    }
    {
        MediaHandlerSecretValue, err = MediaHandlerSecret()
        if err != nil {
            logger.Fatal(err)
        }
    }
    {
        PrivateKeyValue, PrivateKeyVersions, PrivateKeyValueLatestVersion, err = PrivateKey()
        if err != nil {
            logger.Fatal(err)
        }
    }
    {
        PublicKeyValue, PublicKeyVersions, PublicKeyValueLatestVersion, err = PublicKey()
        if err != nil {
            logger.Fatal(err)
        }
    }
    {
        SymmetricKeyValue, SymmetricKeyVersions, SymmetricKeyValueLatestVersion, err = SymmetricKey()
        if err != nil {
            logger.Fatal(err)
        }
    }
    {
        EmailSecretValue, err = EmailSecret()
        if err != nil {
            logger.Fatal(err)
        }
    }
}

// MARK: Public Key
// Get the secret from Secret Manager
func PublicKey() (string, map[string]map[int32]string, int32, error) {

    // Create a new logger
    logger := log.NewWithOptions(os.Stderr, log.Options{
        ReportCaller:    true, // Report the file name and line number
        ReportTimestamp: true, // Report the timestamp
        TimeFormat:      "2006-01-02 15:04:05", // Set the time format
        Prefix:          "SECRET", // Set the prefix
    })

    ctx := context.Background()
    client, err := secretmanager.NewClient(ctx)
    if err != nil {
        logger.Fatal(err)
        return "", nil, int32(0), err
    }
    defer client.Close()

    // List all versions of the secret
    req := &secretmanagerpb.ListSecretVersionsRequest{
        Parent: "projects/gatorpool-449522/secrets/public_key",
    }

    it := client.ListSecretVersions(ctx, req)
    var versions []int32
    var latestVersion int32

    for {
        resp, err := it.Next()
        if err == iterator.Done {
            break
        }
        if err != nil {
            return "", nil, int32(0), err
        }

		// if secret is in DESTROYED state, skip it
		if strings.Contains(resp.State.String(), "DESTROYED") {
			// logger.Info("Secret 'public_key' with version %d is in DESTROYED state", resp.Name)
			// logger.Info("Moving to the next version...")
			continue
		}

        versionStr := strings.Split(resp.Name, "/")
        version, err := strconv.Atoi(versionStr[len(versionStr)-1])
        if err != nil {
            return "", nil, int32(0), err
        }
        versions = append(versions, int32(version))

        if int32(version) > latestVersion {
            latestVersion = int32(version)
        }
    }

    // Loop through each version and access that, then add it to the map
    for _, version := range versions {
        reqVersion := &secretmanagerpb.AccessSecretVersionRequest{
            Name: fmt.Sprintf("projects/gatorpool-449522/secrets/public_key/versions/%d", version),
        }

        result, err := client.AccessSecretVersion(ctx, reqVersion)
        if err != nil {
			// check if secret is in DESTROYED state
			if strings.Contains(err.Error(), "DESTROYED") {
				// logger.Fatal("Secret 'public_key' with version %d is in DESTROYED state", version)
				// logger.Fatal("Moving to the next version...")
				continue
			} else {
				logger.Fatal(err)
				return "", nil, int32(0), err
			}
        }

        secret := string(result.Payload.Data)
        if _, exists := PublicKeyVersions["public_key"]; !exists {
            PublicKeyVersions["public_key"] = make(map[int32]string)
        }
        PublicKeyVersions["public_key"][version] = secret
    }

    // Access the latest version of the secret
    reqLatest := &secretmanagerpb.AccessSecretVersionRequest{
        Name: fmt.Sprintf("projects/gatorpool-449522/secrets/public_key/versions/%d", latestVersion),
    }

    result, err := client.AccessSecretVersion(ctx, reqLatest)
    if err != nil {
        logger.Fatal(err)
        return "", nil, int32(0), err
    }

    latestSecret := string(result.Payload.Data)
    PublicKeyValue = latestSecret
    PublicKeyValueLatestVersion = int32(latestVersion)

    return latestSecret, PublicKeyVersions, latestVersion, nil
}

func GetPublicKeyWithVersion(version int32) (string, bool) {
    if secret, exists := PublicKeyVersions["public_key"][version]; exists {
        return secret, true
    }
    return "", false
}

// MARK: Private Key
// Get the secret from Secret Manager
func PrivateKey() (string, map[string]map[int32]string, int32, error) {

    logger := log.NewWithOptions(os.Stderr, log.Options{
        ReportCaller:    true, // Report the file name and line number
        ReportTimestamp: true, // Report the timestamp
        TimeFormat:      "2006-01-02 15:04:05", // Set the time format
        Prefix:          "SECRET", // Set the prefix
    })

    // Create a new client
    ctx := context.Background()
    client, err := secretmanager.NewClient(ctx)
    if err != nil {
        logger.Fatal(err)
        return "", nil, int32(0), err
    }
    defer client.Close()

    // List all versions of the secret
    req := &secretmanagerpb.ListSecretVersionsRequest{
        Parent: "projects/gatorpool-449522/secrets/private_key",
    }

    it := client.ListSecretVersions(ctx, req)
    var versions []int32
    var latestVersion int32

    for {
        resp, err := it.Next()
        if err == iterator.Done {
            break
        }
        if err != nil {
            return "", nil, int32(0), err
        }

		// if secret is in DESTROYED state, skip it
		if strings.Contains(resp.State.String(), "DESTROYED") {
			// logger.Info("Secret 'private_key' with version %d is in DESTROYED state", resp.Name)
			// logger.Info("Moving to the next version...")
			continue
		}

        versionStr := strings.Split(resp.Name, "/")
        version, err := strconv.Atoi(versionStr[len(versionStr)-1])
        if err != nil {
            return "", nil, int32(0), err
        }
        versions = append(versions, int32(version))

        if int32(version) > latestVersion {
            latestVersion = int32(version)
        }
    }

    // Loop through each version and access that, then add it to the map
    for _, version := range versions {
        reqVersion := &secretmanagerpb.AccessSecretVersionRequest{
            Name: fmt.Sprintf("projects/gatorpool-449522/secrets/private_key/versions/%d", version),
        }

        result, err := client.AccessSecretVersion(ctx, reqVersion)
        if err != nil {
			// check if secret is in DESTROYED state
			if strings.Contains(err.Error(), "DESTROYED") {
				// logger.Fatal("Secret 'private_key' with version %d is in DESTROYED state", version)
				// logger.Fatal("Moving to the next version...")
				continue
			} else {
				logger.Fatal(err)
				return "", nil, int32(0), err
			}
        }

        secret := string(result.Payload.Data)
        if _, exists := PrivateKeyVersions["private_key"]; !exists {
            PrivateKeyVersions["private_key"] = make(map[int32]string)
        }
        PrivateKeyVersions["private_key"][version] = secret
    }

    // Access the latest version of the secret
    reqLatest := &secretmanagerpb.AccessSecretVersionRequest{
        Name: fmt.Sprintf("projects/gatorpool-449522/secrets/private_key/versions/%d", latestVersion),
    }

    result, err := client.AccessSecretVersion(ctx, reqLatest)
    if err != nil {
        logger.Fatal(err)
        return "", nil, int32(0), err
    }

    latestSecret := string(result.Payload.Data)
    PrivateKeyValue = latestSecret
    PrivateKeyValueLatestVersion = int32(latestVersion)

    return latestSecret, PrivateKeyVersions, int32(1), nil
}

func GetPrivateKeyWithVersion(version int32) (string, bool) {
    if secret, exists := PrivateKeyVersions["private_key"][version]; exists {
        return secret, true
    }
    return "", false
}

// MARK: Symmetric Key
// Get the secret from Secret Manager
func SymmetricKey() (string, map[string]map[int32]string, int32, error) {

    // Create a new logger
    logger := log.NewWithOptions(os.Stderr, log.Options{
        ReportCaller:    true, // Report the file name and line number
        ReportTimestamp: true, // Report the timestamp
        TimeFormat:      "2006-01-02 15:04:05", // Set the time format
        Prefix:          "SECRET", // Set the prefix
    })

    // Create a new client
    ctx := context.Background()
    client, err := secretmanager.NewClient(ctx)
    if err != nil {
        logger.Fatal(err)
        return "", nil, int32(0), err
    }
    defer client.Close()

    // List all versions of the secret
    req := &secretmanagerpb.ListSecretVersionsRequest{
        Parent: "projects/gatorpool-449522/secrets/symmetric_key",
    }

    it := client.ListSecretVersions(ctx, req)
    var versions []int32
    var latestVersion int32

    for {
        resp, err := it.Next()
        if err == iterator.Done {
            break
        }
        if err != nil {
            return "", nil, int32(0), err
        }

		// if secret is in DESTROYED state, skip it
		if strings.Contains(resp.State.String(), "DESTROYED") {
			// logger.Info("Secret 'symmetric_key' with version %d is in DESTROYED state", resp.Name)
			// logger.Info("Moving to the next version...")
			continue
		}

        versionStr := strings.Split(resp.Name, "/")
        version, err := strconv.Atoi(versionStr[len(versionStr)-1])
        if err != nil {
            return "", nil, int32(0), err
        }
        versions = append(versions, int32(version))

        if int32(version) > latestVersion {
            latestVersion = int32(version)
        }
    }

    // Loop through each version and access that, then add it to the map
    for _, version := range versions {
        reqVersion := &secretmanagerpb.AccessSecretVersionRequest{
            Name: fmt.Sprintf("projects/gatorpool-449522/secrets/symmetric_key/versions/%d", version),
        }

        result, err := client.AccessSecretVersion(ctx, reqVersion)
        if err != nil {
			// check if secret is in DESTROYED state
			if strings.Contains(err.Error(), "DESTROYED") {
				// logger.Fatal("Secret 'symmetric_key' with version %d is in DESTROYED state", version)
				// logger.Fatal("Moving to the next version...")
				continue
			} else {
				logger.Fatal(err)
				return "", nil, int32(0), err
			}
        }

        secret := string(result.Payload.Data)
        if _, exists := SymmetricKeyVersions["symmetric_key"]; !exists {
            SymmetricKeyVersions["symmetric_key"] = make(map[int32]string)
        }
        SymmetricKeyVersions["symmetric_key"][version] = secret
    }

    // Access the latest version of the secret
    reqLatest := &secretmanagerpb.AccessSecretVersionRequest{
        Name: fmt.Sprintf("projects/gatorpool-449522/secrets/symmetric_key/versions/%d", latestVersion),
    }

    result, err := client.AccessSecretVersion(ctx, reqLatest)
    if err != nil {
        logger.Fatal(err)
        return "", nil, int32(0), err
    }

    // latestVersion := int32(1)
    // tempSec := `0aa915235d82958197f1ebb1d916c75f`
    // SymmetricKeyVersions["symmetric_key"] = make(map[int32]string)
    // SymmetricKeyVersions["symmetric_key"][int32(latestVersion)] = string(tempSec)

    latestSecret := string(result.Payload.Data)
    SymmetricKeyValue = latestSecret
    SymmetricKeyValueLatestVersion = latestVersion

    return latestSecret, SymmetricKeyVersions, latestVersion, nil
}

func GetSymmetricKeyWithVersion(version int32) (string, bool) {
	if secret, exists := SymmetricKeyVersions["symmetric_key"][version]; exists {
		return secret, true
	}
	return "", false
}

// MARK: Database Secret
// Get the secret from Secret Manager
func DatabaseSecret() (string, error) {

	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller: true, // Report the file name and line number
		ReportTimestamp: true, // Report the timestamp
		TimeFormat: "2006-01-02 15:04:05", // Set the time format
		Prefix: "SECRET", // Set the prefix
	})

	// Create a new client
	ctx := context.Background()
	client, err := secretmanager.NewClient(ctx)
	if err != nil {
		logger.Fatal(err)
		return "", err
	}
	defer client.Close()

	// Build the request
	req := &secretmanagerpb.AccessSecretVersionRequest{
		Name: "projects/gatorpool-449522/secrets/mongo_uri/versions/latest",
	}

	// Access the secret
	result, err := client.AccessSecretVersion(ctx, req)
	if err != nil {
		logger.Fatal(err)
		return "", err
	}

	return string(result.Payload.Data), nil
    // return "mongodb+srv://admin:YKwpUUIf8y6tDHYc@void.heszh4x.mongodb.net/?retryWrites=true&w=majority&appName=production", nil

}

// MARK: Media Handler Secret
// Get the secret from Secret Manager
func MediaHandlerSecret() (string, error) {

	// Create a new logger
	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller: true, // Report the file name and line number
		ReportTimestamp: true, // Report the timestamp
		TimeFormat: "2006-01-02 15:04:05", // Set the time format
		Prefix: "SECRET", // Set the prefix
	})

    logger.Info("Checking for Media Handler secret...")

	// Create a new client
	ctx := context.Background()
	client, err := secretmanager.NewClient(ctx)
	if err != nil {
		logger.Fatal(err)
		return "", err
	}
	defer client.Close()

	// Build the request
	req := &secretmanagerpb.AccessSecretVersionRequest{
		Name: "projects/gatorpool-449522/secrets/media_handler_secret/versions/latest",
	}

	// Access the secret
	result, err := client.AccessSecretVersion(ctx, req)
	if err != nil {
		logger.Fatal(err)
		return "", err
	}

    MediaHandlerSecretValue = string(result.Payload.Data)

	// Return the secret
	return string(result.Payload.Data), nil
}

// MARK: Email Secret
// Get the secret from Secret Manager
func EmailSecret() (string, error) {

	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller: true, // Report the file name and line number
		ReportTimestamp: true, // Report the timestamp
		TimeFormat: "2006-01-02 15:04:05", // Set the time format
		Prefix: "SECRET", // Set the prefix
	})

	// Create a new client
	ctx := context.Background()
	client, err := secretmanager.NewClient(ctx)
	if err != nil {
		logger.Fatal(err)
		return "", err
	}
	defer client.Close()

	// Build the request
	req := &secretmanagerpb.AccessSecretVersionRequest{
		Name: "projects/gatorpool-449522/secrets/auth_support_email/versions/latest",
	}

	// Access the secret
	result, err := client.AccessSecretVersion(ctx, req)
	if err != nil {
		logger.Fatal(err)
		return "", err
	}

	// Return the secret
	return string(result.Payload.Data), nil

    // return "jxyq llyx kfje ykgt", nil

}