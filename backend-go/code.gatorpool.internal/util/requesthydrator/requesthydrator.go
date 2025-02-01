package requesthydrator

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"github.com/charmbracelet/log"
)

// ParseJSONBody parses the request body as JSON and returns a map with requested parameters
func ParseJSONBody(r *http.Request, params []string) (map[string]interface{}, error) {
	// Set the logger
	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    true, // Report the file name and line number
		ReportTimestamp: true, // Report the timestamp
		TimeFormat:      "2006-01-02 15:04:05", // Set the time format
		Prefix:          "JSON (PJB)",          // Set the prefix
	})

	// Read the body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		logger.Error("Error reading request body", err)
		return nil, err
	}

	// Reset the request body to allow it to be read again
	r.Body = ioutil.NopCloser(strings.NewReader(string(body)))

	// Unmarshal the JSON into a map
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		logger.Error("Error unmarshalling JSON: ", err)
		return nil, err
	}

	// Create a map to hold the requested parameters
	requestedParams := make(map[string]interface{})

	// Fetch the requested parameters
	for _, param := range params {
		value, err := getNestedValue(result, strings.Split(param, "."))
		if err != nil {
			logger.Error("Error fetching parameter: ", param, err)
			return nil, err
		}
		requestedParams[param] = value
	}

	return requestedParams, nil
}

// getNestedValue fetches the value from a nested map using a slice of keys
func getNestedValue(data map[string]interface{}, keys []string) (interface{}, error) {
	if len(keys) == 0 {
		return nil, errors.New("no keys provided")
	}

	current := data
	for i, key := range keys {
		value, exists := current[key]
		if !exists {
			return nil, errors.New("key not found: " + strings.Join(keys[:i+1], "."))
		}

		// If this is the last key, return the value
		if i == len(keys)-1 {
			return value, nil
		}

		// Move deeper into the map
		if nestedMap, ok := value.(map[string]interface{}); ok {
			current = nestedMap
		} else {
			return nil, errors.New("key does not lead to a nested map: " + strings.Join(keys[:i+1], "."))
		}
	}

	return nil, errors.New("unexpected error")
}