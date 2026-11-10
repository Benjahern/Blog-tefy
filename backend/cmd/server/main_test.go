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

func TestReviewSEOPageIsGeneratedForPublishedReviews(t *testing.T) {
	doc := state{
		Books: []any{map[string]any{"id": "book-1", "title": "Dune", "author": "Frank Herbert", "coverUrl": "/covers/dune.jpg"}},
		Reviews: []any{map[string]any{
			"id": "review-1", "bookId": "book-1", "slug": "dune", "status": "published",
			"title": "El desierto recuerda", "excerpt": "Una lectura inolvidable.",
			"content":     `<p>Una reseña <strong>completa</strong>.</p><script>alert(1)</script>`,
			"publishedAt": "2026-10-20T22:10:00Z", "rating": 4.8,
		}},
		Settings: map[string]any{"siteName": "Nia", "profileName": "Nia"},
	}
	page, redirect, found, err := buildReviewSEOPage(doc, "dune", "https://journal.example")
	if err != nil || !found || redirect != "" {
		t.Fatalf("expected generated SEO page, found=%v redirect=%q err=%v", found, redirect, err)
	}
	var html strings.Builder
	if err := reviewSEOPageTemplate.Execute(&html, page); err != nil {
		t.Fatal(err)
	}
	for _, expected := range []string{
		`<title>Dune — reseña | Nia</title>`,
		`<meta name="description" content="Una lectura inolvidable.">`,
		`<link rel="canonical" href="https://journal.example/resenas/dune">`,
		`<h1>Dune</h1>`,
		`Una reseña <strong>completa</strong>.`,
		`"@type":"Review"`,
		`https://journal.example/covers/dune.jpg`,
		`src="/assets/app.js"`,
	} {
		if !strings.Contains(html.String(), expected) {
			t.Errorf("generated SEO HTML missing %q", expected)
		}
	}
	if strings.Contains(html.String(), "alert(1)") {
		t.Fatal("unsafe review markup survived server sanitization")
	}
}

func TestReviewSEOPageRejectsDraftsAndRedirectsSlugAliases(t *testing.T) {
	doc := state{
		Books: []any{map[string]any{"id": "book-1", "title": "The Book"}},
		Reviews: []any{
			map[string]any{"bookId": "book-1", "slug": "draft", "status": "draft", "content": "private"},
			map[string]any{"bookId": "book-1", "slug": "current-slug", "previousSlugs": []any{"old-slug"}, "status": "published", "content": "public", "rating": 4.0},
		},
	}
	if _, _, found, err := buildReviewSEOPage(doc, "draft", "https://journal.example"); err != nil || found {
		t.Fatalf("draft should not be indexable: found=%v err=%v", found, err)
	}
	_, redirect, found, err := buildReviewSEOPage(doc, "old-slug", "https://journal.example")
	if err != nil || found || redirect != "https://journal.example/resenas/current-slug" {
		t.Fatalf("expected alias redirect, found=%v redirect=%q err=%v", found, redirect, err)
	}
}

func TestPublicReviewHTMLServesPublishedPagesRedirectsAliasesAndHidesDrafts(t *testing.T) {
	t.Setenv("SITE_URL", "https://journal.example")
	a := testApp(t)
	_, err := a.db.Collection("site_content").InsertOne(context.Background(), bson.M{
		"_id":   "main",
		"books": []any{bson.M{"id": "book-1", "title": "Dune", "author": "Frank Herbert"}},
		"reviews": []any{
			bson.M{"bookId": "book-1", "slug": "dune", "previousSlugs": []any{"old-dune"}, "status": "published", "content": "<p>Public text</p>", "rating": 4.5},
			bson.M{"bookId": "book-1", "slug": "private-draft", "status": "draft", "content": "secret", "rating": 5.0},
		},
		"settings": bson.M{"siteName": "Nia"},
	})
	if err != nil {
		t.Fatal(err)
	}

	request := func(slug string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/public/review-html/"+slug, nil)
		req.SetPathValue("slug", slug)
		res := httptest.NewRecorder()
		a.publicReviewHTML(res, req)
		return res
	}

	page := request("dune")
	if page.Code != http.StatusOK || !strings.Contains(page.Body.String(), "Public text") || !strings.Contains(page.Body.String(), "<title>Dune — reseña | Nia</title>") {
		t.Fatalf("expected indexable published review, got status=%d body=%s", page.Code, page.Body.String())
	}
	alias := request("old-dune")
	if alias.Code != http.StatusMovedPermanently || alias.Header().Get("Location") != "https://journal.example/resenas/dune" {
		t.Fatalf("expected canonical alias redirect, got status=%d location=%q", alias.Code, alias.Header().Get("Location"))
	}
	draft := request("private-draft")
	if draft.Code != http.StatusNotFound || strings.Contains(draft.Body.String(), "secret") {
		t.Fatalf("draft must not be public, got status=%d body=%s", draft.Code, draft.Body.String())
	}
}

func TestPublicReviewHTMLReturnsNotFoundWhenNoPublishedContentExists(t *testing.T) {
	a := testApp(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/public/review-html/missing", nil)
	req.SetPathValue("slug", "missing")
	response := httptest.NewRecorder()
	a.publicReviewHTML(response, req)
	if response.Code != http.StatusNotFound {
		t.Fatalf("missing review should be 404, got %d", response.Code)
	}
}

func TestReviewSEOHelpersCoverEdgeCases(t *testing.T) {
	for _, value := range []any{float32(4.5), int(4), int32(3), int64(2)} {
		if numericValue(value) == 0 {
			t.Errorf("numericValue(%T) unexpectedly returned zero", value)
		}
	}
	if numericValue("4.5") != 0 {
		t.Fatal("unsupported rating type should default to zero")
	}
	if values := stringValues([]string{"one", "two"}); len(values) != 2 {
		t.Fatalf("expected string slice to be returned, got %#v", values)
	}
	if values := stringValues("not-a-list"); len(values) != 0 {
		t.Fatalf("expected unsupported list to be empty, got %#v", values)
	}
	if got := truncateRunes("hola", 2); got != "ho" {
		t.Fatalf("truncateRunes did not clip text: %q", got)
	}
	if got := publicSEOImage("//evil.example/cover.jpg", "https://journal.example"); got != "" {
		t.Fatalf("protocol-relative cover URL must be rejected: %q", got)
	}
	if got := publicSEOImage("not a url", "https://journal.example"); got != "" {
		t.Fatalf("invalid cover URL must be rejected: %q", got)
	}

	doc := state{
		Books:   []any{map[string]any{"id": "book-1", "title": "", "author": ""}},
		Reviews: []any{map[string]any{"bookId": "book-1", "slug": "fallbacks", "status": "published", "content": strings.Repeat("<p>á</p>", 100), "rating": int(4), "updatedAt": "2026-11-01"}},
	}
	page, _, found, err := buildReviewSEOPage(doc, "fallbacks", "https://journal.example/")
	if err != nil || !found || page.BookTitle != "Reseña literaria" || page.SiteName != "Nia" || page.PublishedAt != "2026-11-01" {
		t.Fatalf("SEO metadata fallbacks failed: page=%#v found=%v err=%v", page, found, err)
	}
	if len([]rune(page.Description)) > 300 || page.Description == "" {
		t.Fatalf("expected a bounded description from review content, got length=%d", len([]rune(page.Description)))
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
