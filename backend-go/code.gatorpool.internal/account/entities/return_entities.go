package entities

type ReturnLoadInStatusCard struct {
	UUID 				string 		`json:"uuid"`
	Title	   			string 		`json:"title"`
	Description 		string 		`json:"description"`
	Type 				string 		`json:"type"`
	Action 				string 		`json:"action"`
	ActionName 			string 		`json:"action_name"`
	DisplayType 		string 		`json:"display_type"`
}

type ReturnLoadInBottomAction struct {
	UUID 				string 		`json:"uuid"`
	Title	   			string 		`json:"title"`
	Description 		string 		`json:"description"`
	Type 				string 		`json:"type"`
	Action 				string 		`json:"action"`
	ActionName 			string 		`json:"action_name"`
	DisplayType 		string 		`json:"display_type"`
	DisplayBlob 		string 		`json:"display_blob"`
}