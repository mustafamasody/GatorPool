package mocks

import (
	"context"
	"go.mongodb.org/mongo-driver/mongo"
)

type Key int

const (
	MockKey Key = iota
)

func IsMock(ctx context.Context) bool {
	val, ok := ctx.Value(MockKey).(*mongo.Database)
	return ok && val != nil
}