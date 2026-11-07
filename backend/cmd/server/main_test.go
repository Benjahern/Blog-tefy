package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/argon2"
)

func TestPublishedOnlyDoesNotExposeDrafts(t *testing.T) {
	items := []any{map[string]any{"id": "public", "status": "published"}, map[string]any{"id": "private", "status": "draft"}}
	out := publishedOnly(items)
	if len(out) != 1 || asMap(out[0])["id"] != "public" {
		t.Fatalf("unexpected public reviews: %#v", out)
	}
}

func TestReviewContentPolicyAllowsOnlyKnownFontFamilies(t *testing.T) {
	policy := reviewContentPolicy()
	valid := policy.Sanitize(`<p><span data-font="times-new-roman">classic</span></p>`)
	if !strings.Contains(valid, `data-font="times-new-roman"`) {
		t.Fatalf("expected recognized font to survive sanitization, got %q", valid)
	}
	unsafe := policy.Sanitize(`<p><span data-font="evil" style="color:red" onclick="alert(1)">text</span></p>`)
	if strings.Contains(unsafe, "data-font") || strings.Contains(unsafe, "style=") || strings.Contains(unsafe, "onclick") {
		t.Fatalf("unsafe font attributes survived sanitization: %q", unsafe)
	}
}

func testApp(t *testing.T) *app {
	t.Helper()
	uri := os.Getenv("TEST_MONGODB_URI")
	if uri == "" {
		t.Skip("TEST_MONGODB_URI is not configured")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		t.Fatal(err)
	}
	if err := client.Ping(ctx, nil); err != nil {
		t.Fatal(err)
	}
	db := client.Database("auth_test_" + bson.NewObjectID().Hex())
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		_ = db.Drop(cleanupCtx)
		_ = client.Disconnect(cleanupCtx)
	})
	return &app{db: db}
}

func TestAdminAuthRejectsMissingAndUnknownSessions(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("COOKIE_SECURE", "false")
	a := testApp(t)
	handler := a.auth(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	for _, token := range []string{"", "not-a-session"} {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/content", nil)
		if token != "" {
			req.AddCookie(&http.Cookie{Name: sessionCookieName(), Value: token})
		}
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)
		if res.Code != http.StatusUnauthorized {
			t.Fatalf("token %q: expected 401, got %d", token, res.Code)
		}
	}
}

func TestAdminAuthRequiresActiveUserAndCSRFForWrites(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("COOKIE_SECURE", "false")
	a := testApp(t)
	ctx := context.Background()
	userID := bson.NewObjectID()
	if _, err := a.db.Collection("users").InsertOne(ctx, bson.M{"_id": userID, "username": "admin", "active": true}); err != nil {
		t.Fatal(err)
	}
	token := "valid-test-session"
	sum := sha256.Sum256([]byte(token))
	if _, err := a.db.Collection("sessions").InsertOne(ctx, bson.M{"tokenHash": hex.EncodeToString(sum[:]), "userId": userID, "expiresAt": time.Now().Add(time.Hour)}); err != nil {
		t.Fatal(err)
	}
	handler := a.auth(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	request := func(method string, withCSRF bool) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, "/api/v1/admin/content", nil)
		req.AddCookie(&http.Cookie{Name: sessionCookieName(), Value: token})
		if withCSRF {
			req.AddCookie(&http.Cookie{Name: "nia_csrf", Value: "csrf-test"})
			req.Header.Set("X-CSRF-Token", "csrf-test")
		}
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)
		return res
	}
	if res := request(http.MethodGet, false); res.Code != http.StatusNoContent {
		t.Fatalf("active session GET: expected 204, got %d", res.Code)
	}
	if res := request(http.MethodPut, false); res.Code != http.StatusForbidden {
		t.Fatalf("write without CSRF: expected 403, got %d", res.Code)
	}
	if res := request(http.MethodPut, true); res.Code != http.StatusNoContent {
		t.Fatalf("write with CSRF: expected 204, got %d", res.Code)
	}
	if _, err := a.db.Collection("users").UpdateOne(ctx, bson.M{"_id": userID}, bson.M{"$set": bson.M{"active": false}}); err != nil {
		t.Fatal(err)
	}
	if res := request(http.MethodGet, false); res.Code != http.StatusUnauthorized {
		t.Fatalf("inactive account: expected 401, got %d", res.Code)
	}
}

func TestSitemapContainsPublishedReviewsOnly(t *testing.T) {
	t.Setenv("SITE_URL", "https://journal.example")
	urls := sitemapLocations([]any{
		map[string]any{"slug": "public-review", "status": "published"},
		map[string]any{"slug": "private-draft", "status": "draft"},
	}, siteBaseURL())
	if len(urls) != 7 || urls[6] != "https://journal.example/resenas/public-review" {
		t.Fatalf("unexpected sitemap locations: %#v", urls)
	}
	for _, loc := range urls {
		if strings.Contains(loc, "private-draft") {
			t.Fatalf("draft leaked into sitemap: %s", loc)
		}
	}
}

func TestRobotsUsesConfiguredSiteURL(t *testing.T) {
	t.Setenv("SITE_URL", "https://journal.example/")
	response := httptest.NewRecorder()
	(&app{}).robotsTxt(response, httptest.NewRequest(http.MethodGet, "/robots.txt", nil))
	if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), "Sitemap: https://journal.example/api/v1/public/sitemap.xml") {
		t.Fatalf("robots.txt did not use SITE_URL: %s", response.Body.String())
	}
}

func TestVerifyPasswordArgon2id(t *testing.T) {
	password, salt := "strong-test-password", []byte("0123456789abcdef")
	hash := argon2.IDKey([]byte(password), salt, 1, 8*1024, 1, 32)
	encoded := fmt.Sprintf("$argon2id$v=19$m=8192,t=1,p=1$%s$%s", hex.EncodeToString(salt), hex.EncodeToString(hash))
	if !verifyPassword(password, encoded) {
		t.Fatal("expected valid Argon2id password to verify")
	}
	if verifyPassword("wrong", encoded) {
		t.Fatal("wrong password must not verify")
	}
}
