package config

import (
	"context"
	"net/http"
	"strings"

	accountEntities "code.gatorpool.internal/account/entities"
	configEntities "code.gatorpool.internal/config/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	"code.gatorpool.internal/util"
	"code.gatorpool.internal/util/ptr"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetBannerAnnouncement(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	email := req.Header.Get("X-GatorPool-Username")
	email = strings.ToLower(email)

	if email == "" {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "email is required"})
	}

	accountsCollection := datastores.GetMongoDatabase(ctx).Collection(datastores.Accounts)

	accountQuery := bson.D{{Key: "email", Value: email}}
	var account accountEntities.AccountEntity
	err := accountsCollection.FindOne(ctx, accountQuery).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"error": "account not found"})
		} else {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	configCollection := datastores.GetMongoDatabase(ctx).Collection(datastores.Config)

	configQuery := bson.D{{Key: "app_id", Value: "gatorpool"}}
	var config *configEntities.ConfigEntity
	err = configCollection.FindOne(ctx, configQuery).Decode(&config)
	if err != nil {
		if err == mongo.ErrNoDocuments {

			newConfig := &configEntities.ConfigEntity{
				AppID: ptr.String("gatorpool"),
				Announcement: nil,
			}

			_, err = configCollection.InsertOne(ctx, newConfig)
			if err != nil {
				return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
			}

			return util.JSONResponse(res, http.StatusOK, map[string]interface{}{"announcement": nil})

		} else {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	if account.AnnouncementVersion == nil {
		account.AnnouncementVersion = ptr.Int64(0)

		_, err = accountsCollection.UpdateOne(ctx, accountQuery, bson.D{{Key: "$set", Value: bson.D{{Key: "announcement_version", Value: account.AnnouncementVersion}}}})
		if err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	if config.Announcement == nil {
		config.Announcement = &configEntities.AnnouncementEntity{
			Version: ptr.Int64(0),
			Announcement: nil,
			Type: nil,
		}

		_, err = configCollection.UpdateOne(ctx, configQuery, bson.D{{Key: "$set", Value: bson.D{{Key: "announcement", Value: config.Announcement}}}})
		if err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	if *account.AnnouncementVersion < *config.Announcement.Version {
		return util.JSONResponse(res, http.StatusOK, map[string]interface{}{"announcement": config.Announcement})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{"announcement": nil})
}

func CloseAnnouncement(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	email := req.Header.Get("X-GatorPool-Username")
	email = strings.ToLower(email)

	if email == "" {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "email is required"})
	}

	accountsCollection := datastores.GetMongoDatabase(ctx).Collection(datastores.Accounts)

	accountQuery := bson.D{{Key: "email", Value: email}}
	var account accountEntities.AccountEntity
	err := accountsCollection.FindOne(ctx, accountQuery).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return util.JSONResponse(res, http.StatusNotFound, map[string]interface{}{"error": "account not found"})
		} else {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	configCollection := datastores.GetMongoDatabase(ctx).Collection(datastores.Config)

	configQuery := bson.D{{Key: "app_id", Value: "gatorpool"}}
	var config *configEntities.ConfigEntity
	err = configCollection.FindOne(ctx, configQuery).Decode(&config)
	if err != nil {
		if err == mongo.ErrNoDocuments {

			newConfig := &configEntities.ConfigEntity{
				AppID: ptr.String("gatorpool"),
				Announcement: nil,
			}

			_, err = configCollection.InsertOne(ctx, newConfig)
			if err != nil {
				return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
			}

			return util.JSONResponse(res, http.StatusOK, map[string]interface{}{"announcement": nil})

		} else {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	if account.AnnouncementVersion == nil {
		account.AnnouncementVersion = ptr.Int64(0)

		_, err = accountsCollection.UpdateOne(ctx, accountQuery, bson.D{{Key: "$set", Value: bson.D{{Key: "announcement_version", Value: account.AnnouncementVersion}}}})
		if err != nil {
			return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		}
	}

	if *account.AnnouncementVersion == *config.Announcement.Version {
		return util.JSONResponse(res, http.StatusBadRequest, map[string]interface{}{"error": "announcement is already closed"})
	}

	account.AnnouncementVersion = config.Announcement.Version

	_, err = accountsCollection.UpdateOne(ctx, accountQuery, bson.D{{Key: "$set", Value: bson.D{{Key: "announcement_version", Value: account.AnnouncementVersion}}}})
	if err != nil {
		return util.JSONResponse(res, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{"success": true})
}