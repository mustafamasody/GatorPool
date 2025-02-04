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
	Color 				string 		`json:"color"`
	Action 				string 		`json:"action"`
	ActionName 			string 		`json:"action_name"`
	FlowData			map[string]interface{} `json:"flow_data"`
	DisplayType 		string 		`json:"display_type"`
	DisplayBlob 		string 		`json:"display_blob"`
}