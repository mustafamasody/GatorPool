package entities

type ConfigEntity struct {
	AppID	   		*string    				`json:"app_id" bson:"app_id"`
	Announcement 	*AnnouncementEntity 	`json:"announcement" bson:"announcement"`
}

type AnnouncementEntity struct {
	Version    		*int64     	`json:"version" bson:"version"`
	Announcement    *string    	`json:"announcement" bson:"announcement"`
	Type   			*string    	`json:"type" bson:"type"` // general, warning,
}