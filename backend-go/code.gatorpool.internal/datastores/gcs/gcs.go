package gcs

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"os"
	"time"

	"code.gatorpool.internal/guardian/secrets"

	util "code.gatorpool.internal/util"

	"cloud.google.com/go/storage"
	"github.com/charmbracelet/log"
	"github.com/google/uuid"
	"google.golang.org/api/option"

	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
)

var (
	StorageClient  *storage.Client
	GoogleAccessID string
	PrivateKey     []byte
)

// Custom implementation of multipart.File
type MultipartFile struct {
	io.Reader
	io.ReaderAt
	io.Seeker
}

// Implement the Close() method to satisfy the multipart.File interface
func (mf *MultipartFile) Close() error {
	// No resources to close in this case, as we are using an in-memory buffer.
	return nil
}

const (
	BucketName = "gatorpool-449522.appspot.com"
	ProjectID  = "gatorpool-449522"
)

// MARK: InitMediaHandler
func InitMediaHandler() {

	logger := log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    true,                  // Report the file name and line number
		ReportTimestamp: true,                  // Report the timestamp
		TimeFormat:      "2006-01-02 15:04:05", // Set the time format
		Prefix:          "MEDIA",               // Set the prefix
	})

	gcpServiceAccount := secrets.MediaHandlerSecretValue
	if gcpServiceAccount == "" {
		logger.Error("GCP service account is not set")
	}

	opts := option.WithCredentialsJSON([]byte(gcpServiceAccount))

	ctx := context.Background()
	newStorage, err := storage.NewClient(ctx, opts)
	if err != nil {
		logger.Error("Failed to create storage client: " + err.Error())
		return
	}

	StorageClient = newStorage

	logger.Info("Storage client created successfully")

}

type MediaEntity struct {
	UUID     string    `json:"uuid"`
	FileName string    `json:"file_name"`
	Type     string    `json:"type"`
	Route    string    `json:"route"`
	Date     time.Time `json:"date"`
}

// MARK: Upload
func Upload(req *http.Request) ([]MediaEntity, error) {
	mediaEntities := []MediaEntity{}

	// Parse the multipart form with a max memory of 32MB
	err := req.ParseMultipartForm(32 << 20)
	if err != nil {
		return nil, errors.New("failed to parse multipart form: " + err.Error())
	}

	// Retrieve the files from the form
	form := req.MultipartForm
	files := form.File["files"]

	// Get the request body
	body, err := util.ParseJSONBodyMultipart(req)
	if err != nil {
		return nil, errors.New("Invalid request body: Body can't be parsed: " + err.Error())
	}

	// Get the type of upload from the request body
	typeOfUpload, ok := body["type"].(string)
	if !ok {
		return nil, errors.New("invalid request body: Type is missing")
	}

	// Check if files exist
	if files == nil {
		return nil, errors.New("files not found")
	}

	// Limit the number of files to 10
	if len(files) > 10 {
		return nil, errors.New("you can only upload 10 files at a time")
	}

	// Loop through each file
	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			return nil, errors.New("failed to open file: " + err.Error())
		}
		defer file.Close()

		// Get the file size
		size, err := file.Seek(0, io.SeekEnd)
		if err != nil {
			return nil, errors.New("failed to determine file size: " + err.Error())
		}
		if size > 10*1024*1024 {
			return nil, errors.New("file size is too large: " + fileHeader.Filename)
		}

		// Reset the file pointer to the beginning
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			return nil, errors.New("failed to reset file offset: " + err.Error())
		}

		// Determine MIME type
		mimeType := fileHeader.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = "image/jpeg" // Default MIME type if not detected
		}

		// Handle image conversion only for profile pictures
		if typeOfUpload == "profile_picture" {
			img, _, err := image.Decode(file)
			if err != nil {
				return nil, errors.New("failed to decode image: " + err.Error())
			}

			// Create a buffer to hold the JPEG data
			jpegBuffer := new(bytes.Buffer)

			// Encode the image as JPEG
			err = jpeg.Encode(jpegBuffer, img, nil)
			if err != nil {
				return nil, errors.New("failed to encode image to JPEG: " + err.Error())
			}

			// Reopen the file from the buffer
			file = &MultipartFile{
				Reader:   bytes.NewReader(jpegBuffer.Bytes()),
				ReaderAt: bytes.NewReader(jpegBuffer.Bytes()),
				Seeker:   bytes.NewReader(jpegBuffer.Bytes()),
			}

			mimeType = "image/jpeg"
			size = int64(jpegBuffer.Len())
			_ = size
		}

		// Generate unique file name and path based on the upload type
		mediaID := uuid.New().String()
		fileName := generateFileName(typeOfUpload, mediaID, req.Header.Get("X-GatorPool-Username"), mimeType)

		// Upload the file to Google Cloud Storage
		uploaded := StorageClient.Bucket(BucketName).Object(fileName).NewWriter(context.Background())
		uploaded.ContentType = mimeType
		if _, err := io.Copy(uploaded, file); err != nil {
			return nil, errors.New("failed to upload file: " + err.Error())
		}
		if err := uploaded.Close(); err != nil {
			return nil, errors.New("failed to close writer: " + err.Error())
		}

		// Create a new media entity
		newMedia := MediaEntity{
			UUID:     mediaID,
			FileName: fileName,
			Type:     typeOfUpload,
			Route:    "https://storage.googleapis.com/" + BucketName + "/" + fileName,
			Date:     time.Now(),
		}

		// Append the new media entity to the media entities array
		mediaEntities = append(mediaEntities, newMedia)
	}

	return mediaEntities, nil
}

// generateFileName constructs the file name based on the upload type and other parameters
func generateFileName(uploadType, mediaID, account string, mimeType string) string {
	switch uploadType {
	case "profile_picture":
		return "accounts/" + account + "/profile_picture." + mimeType[6:]
	default:
		return "accounts/" + uploadType + "s/" + mediaID
	}
}

func Delete(fileName string) error {

	objectHandle := StorageClient.Bucket(BucketName).Object(fileName)
	err := objectHandle.Delete(context.Background())
	if err != nil {
		return errors.New("failed to delete file: " + err.Error())
	}

	return nil

}

type SignedURLEntity struct {
	Route     string    `json:"routes"`
	SignedURL string    `json:"signed_urls"`
	Date      time.Time `json:"date"`
}

// MARK: CreateSignedURL
func CreateSignedURL(routes []string) ([]SignedURLEntity, error) {

	returnables := []SignedURLEntity{}

	// Check if routes length is more than 10
	if len(routes) > 10 {
		return nil, errors.New("you can only create signed URLs for 10 files at a time")
	}

	// Loop through each route
	for _, route := range routes {

		objectHandle := StorageClient.Bucket(BucketName).Object(route)
		_, err := objectHandle.Attrs(context.Background())
		if err == storage.ErrObjectNotExist {
			return nil, errors.New("file not found 2: " + route + " does not exist")
		}
		if err != nil {
			return nil, errors.New("failed to check if file exists: " + err.Error())
		}

		opts := &storage.SignedURLOptions{
			Scheme:         storage.SigningSchemeV2,
			GoogleAccessID: GoogleAccessID,
			PrivateKey:     PrivateKey,
			Method:         "GET",
			Expires:        time.Now().Add(time.Hour),
		}

		signedURL, err := StorageClient.Bucket(BucketName).SignedURL(route, opts)
		if err != nil {
			return nil, errors.New("failed to generate signed URL: " + err.Error())
		}

		// Create a new signed URL entity
		newSignedURL := SignedURLEntity{
			Route:     route,
			SignedURL: signedURL,
			Date:      time.Now(),
		}

		// Append the new signed URL entity to the returnables array
		returnables = append(returnables, newSignedURL)
	}

	return returnables, nil

}
