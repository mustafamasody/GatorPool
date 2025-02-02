package handler

import (
	"errors"
	"net/smtp"
	"os"
	"slices"
	"strings"

	"code.gatorpool.internal/guardian/secrets"
)

type EmailRequestBody struct {
	Email    string            `json:"email"`
	Subject  string            `json:"subject"`
	Template string            `json:"template"`
	Data     map[string]string `json:"data"`
}

func SendEmail(body EmailRequestBody) error {
	// List of allowed templates
	templates := []string{
		"verify-create-account",
	}

	// Validate the template
	if !slices.Contains(templates, body.Template) {
		return errors.New("invalid template")
	}

	// Determine the template path
	path := "templates/" + body.Template + ".html"
	if os.Getenv("ENV") == "production" {
		path = "templates/" + body.Template + ".html"
	}

	// Read the email template
	emailTemplate, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	// Replace placeholders in the template with data
	emailTemplateStr := string(emailTemplate)
	for key, value := range body.Data {
		emailTemplateStr = strings.ReplaceAll(emailTemplateStr, "{{"+key+"}}", value)
	}

	// Set subject based on the template
	subject := ""
	switch body.Template {
	case "verify-create-account":
		subject = "GatorPool - Verify your email"
	default:
		return errors.New("template not recognized")
	}

	// Construct email headers
	headers := "From: ufgatorpool@gmail.com\n" +
		"To: " + body.Email + "\n" +
		"Subject: " + subject + "\n" +
		"MIME-version: 1.0\nContent-Type: text/html; charset=\"UTF-8\"\n\n"

	// Combine headers and the email body
	message := []byte(headers + emailTemplateStr)

	// Set up SMTP authentication
	auth := smtp.PlainAuth(
		"",
		"ufgatorpool@gmail.com",
		secrets.EmailSecretValue,
		"smtp.gmail.com",
	)

	// Send the email
	err = smtp.SendMail(
		"smtp.gmail.com:587",
		auth,
		"ufgatorpool@gmail.com",
		[]string{body.Email},
		message,
	)
	if err != nil {
		return err
	}

	return nil
}
