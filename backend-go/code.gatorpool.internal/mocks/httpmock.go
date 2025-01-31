package mocks

import "net/http"

// DummyResponseWriter simulates http.ResponseWriter for testing purposes.
type DummyResponseWriter struct {
	StatusCode int
	HeaderMap  http.Header
	Body       []byte
}

func (d *DummyResponseWriter) Header() http.Header {
	if d.HeaderMap == nil {
		d.HeaderMap = make(http.Header)
	}
	return d.HeaderMap
}

func (d *DummyResponseWriter) Write(b []byte) (int, error) {
	d.Body = append(d.Body, b...)
	return len(b), nil
}

func (d *DummyResponseWriter) WriteHeader(statusCode int) {
	d.StatusCode = statusCode
}
