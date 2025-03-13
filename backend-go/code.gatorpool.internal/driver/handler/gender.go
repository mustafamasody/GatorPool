package handler

import (
	"context"
	"fmt"
	"net/http"

	accountEntities "code.gatorpool.internal/account/entities"
	"code.gatorpool.internal/util"
)

func GetDriverGender(req *http.Request, res http.ResponseWriter, ctx context.Context) *http.Response {

	// Get the account object from context
	account, ok := req.Context().Value("account").(accountEntities.AccountEntity) // No pointer
	if !ok {
		fmt.Println("Account object is missing in context")
		return util.JSONResponse(res, http.StatusUnauthorized, map[string]interface{}{
			"error": "no account in context",
		})
	}

	if account.Gender == nil {
		return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
			"success": false,
			"error": "gender not set",
		})
	}

	return util.JSONResponse(res, http.StatusOK, map[string]interface{}{
		"success": true,
		"gender": *account.Gender,
	})

}