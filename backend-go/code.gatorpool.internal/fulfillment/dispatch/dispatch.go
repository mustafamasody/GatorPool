package dispatch

import (
	"context"
	// "fmt"
	// "net/http"
	// "time"

	// accountEntities "code.gatorpool.internal/account/entities"
	datastores "code.gatorpool.internal/datastores/mongo"
	// tripEntities "code.gatorpool.internal/trip/entities"
	warningEntities "code.gatorpool.internal/fulfillment/entities"
	// "code.gatorpool.internal/util"
	// "code.gatorpool.internal/util/ptr"
	// "github.com/go-chi/chi"
	// "go.mongodb.org/mongo-driver/bson"
)

func DispatchWarningEvent(warning *warningEntities.WarningEntity, userUUID string) (bool, error) {

	ctx := context.Background()

	db := datastores.GetMongoDatabase(ctx)
	warningsCollection := db.Collection(datastores.Warnings)

	_, err := warningsCollection.InsertOne(ctx, warning)
	if err != nil {
		return false, err
	}

	return true, nil
}