package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"errors"
	"fmt"
	"golang.org/x/crypto/argon2"
	"html"
	htmltemplate "html/template"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/microcosm-cc/bluemonday"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type state struct {
	Version  int            `json:"version" bson:"version"`
	Books    []any          `json:"books" bson:"books"`
	Reviews  []any          `json:"reviews" bson:"reviews"`
	Genres   []any          `json:"genres" bson:"genres"`
	Series   []any          `json:"series" bson:"series"`
	Settings map[string]any `json:"settings" bson:"settings"`
}
type app struct{ db *mongo.Database }
type authUserKey struct{}

func main() {
	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		log.Fatal("MONGODB_URI is required")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	if err = client.Ping(ctx, nil); err != nil {
		log.Fatal(err)
	}
	a := &app{db: client.Database(env("MONGO_DATABASE", "tefy"))}
	_, _ = a.db.Collection("sessions").Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "expiresAt", Value: 1}}, Options: options.Index().SetExpireAfterSeconds(0)})
	_, _ = a.db.Collection("sessions").Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "tokenHash", Value: 1}}, Options: options.Index().SetUnique(true)})
	_, _ = a.db.Collection("users").Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "username", Value: 1}}, Options: options.Index().SetUnique(true)})
	_, _ = a.db.Collection("review_working_copies").Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "userId", Value: 1}, {Key: "reviewId", Value: 1}}, Options: options.Index().SetUnique(true)})
	if username, password := os.Getenv("BOOTSTRAP_ADMIN_USERNAME"), os.Getenv("BOOTSTRAP_ADMIN_PASSWORD"); username != "" && password != "" {
		salt := make([]byte, 16)
		if _, e := rand.Read(salt); e != nil {
			log.Fatal(e)
		}
		hash := argon2.IDKey([]byte(password), salt, 3, 65536, 2, 32)
		encoded := fmt.Sprintf("$argon2id$v=19$m=65536,t=3,p=2$%s$%s", hex.EncodeToString(salt), hex.EncodeToString(hash))
		_, e := a.db.Collection("users").UpdateOne(ctx, bson.M{"username": strings.ToLower(username)}, bson.M{"$setOnInsert": bson.M{"username": strings.ToLower(username), "passwordHash": encoded, "active": true, "createdAt": time.Now()}}, options.UpdateOne().SetUpsert(true))
		if e != nil {
			log.Fatal(e)
		}
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) { jsonResponse(w, 200, map[string]string{"status": "ok"}) })
	mux.HandleFunc("GET /api/v1/public/content", a.publicContent)
	mux.HandleFunc("GET /api/v1/public/review-html/{slug}", a.publicReviewHTML)
	mux.HandleFunc("GET /api/v1/public/sitemap.xml", a.publicSitemap)
	mux.HandleFunc("GET /robots.txt", a.robotsTxt)
	mux.HandleFunc("GET /api/v1/auth/csrf", a.csrf)
	mux.HandleFunc("POST /api/v1/auth/login", a.login)
	mux.HandleFunc("POST /api/v1/auth/logout", a.logout)
	mux.Handle("GET /api/v1/auth/session", a.auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		jsonResponse(w, 200, map[string]any{"authenticated": true})
	})))
	mux.Handle("GET /api/v1/admin/content", a.auth(http.HandlerFunc(a.adminContent)))
	mux.Handle("PUT /api/v1/admin/content", a.auth(http.HandlerFunc(a.saveContent)))
	mux.Handle("GET /api/v1/admin/reviews/{id}/working-copy", a.auth(http.HandlerFunc(a.getWorkingCopy)))
	mux.Handle("PUT /api/v1/admin/reviews/{id}/working-copy", a.auth(http.HandlerFunc(a.putWorkingCopy)))
	mux.Handle("DELETE /api/v1/admin/reviews/{id}/working-copy", a.auth(http.HandlerFunc(a.deleteWorkingCopy)))
	addr := env("LISTEN_ADDR", ":8080")
	server := &http.Server{Addr: addr, Handler: securityHeaders(mux), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second}
	log.Printf("API listening on %s", addr)
	log.Fatal(server.ListenAndServe())
}
func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
func jsonResponse(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func fail(w http.ResponseWriter, status int, code, msg string) {
	jsonResponse(w, status, map[string]any{"error": map[string]string{"code": code, "message": msg}})
}
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}
func (a *app) csrf(w http.ResponseWriter, r *http.Request) {
	token := randomToken(32)
	http.SetCookie(w, &http.Cookie{Name: "nia_csrf", Value: token, Path: "/", Secure: secure(), SameSite: http.SameSiteLaxMode})
	jsonResponse(w, 200, map[string]string{"token": token})
}
func sessionCookieName() string {
	if secure() {
		return "__Host-nia_session"
	}
	return "nia_session"
}
func secure() bool {
	return strings.EqualFold(os.Getenv("COOKIE_SECURE"), "true") || os.Getenv("APP_ENV") == "production"
}
func randomToken(n int) string {
	b := make([]byte, n)
	if _, e := rand.Read(b); e != nil {
		panic(e)
	}
	return hex.EncodeToString(b)
}
func (a *app) login(w http.ResponseWriter, r *http.Request) {
	if !csrfOK(r) {
		fail(w, 403, "csrf_failed", "Solicitud no válida")
		return
	}
	var in struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&in) != nil {
		fail(w, 400, "invalid_request", "Solicitud no válida")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var user bson.M
	err := a.db.Collection("users").FindOne(ctx, bson.M{"username": strings.ToLower(strings.TrimSpace(in.Username)), "active": true}).Decode(&user)
	if err != nil || !verifyPassword(in.Password, stringValue(user["passwordHash"])) {
		fail(w, 401, "invalid_credentials", "Usuario o contraseña incorrectos")
		return
	}
	token := randomToken(32)
	sum := sha256.Sum256([]byte(token))
	expires := time.Now().Add(12 * time.Hour)
	_, err = a.db.Collection("sessions").InsertOne(ctx, bson.M{"tokenHash": hex.EncodeToString(sum[:]), "userId": user["_id"], "expiresAt": expires})
	if err != nil {
		fail(w, 500, "server_error", "No se pudo iniciar sesión")
		return
	}
	http.SetCookie(w, &http.Cookie{Name: sessionCookieName(), Value: token, Path: "/", HttpOnly: true, Secure: secure(), SameSite: http.SameSiteLaxMode, Expires: expires})
	jsonResponse(w, 200, map[string]any{"authenticated": true, "username": user["username"]})
}
func stringValue(v any) string { s, _ := v.(string); return s }
func verifyPassword(password, encoded string) bool { // bcrypt hashes are verified with the standard crypt-compatible command during provisioning.
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" {
		return false
	}
	var memory, iterations, parallelism uint32
	if parts[2] != "v=19" {
		return false
	}
	if _, e := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism); e != nil || memory > 262144 || iterations > 10 || parallelism > 8 {
		return false
	}
	salt, e := hex.DecodeString(parts[4])
	if e != nil || len(salt) < 16 {
		return false
	}
	expected, e := hex.DecodeString(parts[5])
	if e != nil || len(expected) != 32 {
		return false
	}
	got := argon2.IDKey([]byte(password), salt, iterations, memory, uint8(parallelism), 32)
	return subtle.ConstantTimeCompare(got, expected) == 1
}
func csrfOK(r *http.Request) bool {
	c, e := r.Cookie("nia_csrf")
	return e == nil && c.Value != "" && c.Value == r.Header.Get("X-CSRF-Token")
}
func (a *app) logout(w http.ResponseWriter, r *http.Request) {
	if !csrfOK(r) {
		fail(w, 403, "csrf_failed", "Solicitud no válida")
		return
	}
	if c, e := r.Cookie(sessionCookieName()); e == nil {
		h := sha256.Sum256([]byte(c.Value))
		_, _ = a.db.Collection("sessions").DeleteOne(r.Context(), bson.M{"tokenHash": hex.EncodeToString(h[:])})
	}
	http.SetCookie(w, &http.Cookie{Name: sessionCookieName(), Value: "", Path: "/", HttpOnly: true, Secure: secure(), SameSite: http.SameSiteLaxMode, MaxAge: -1})
	w.WriteHeader(http.StatusNoContent)
}
func (a *app) auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, e := r.Cookie(sessionCookieName())
		if e != nil {
			fail(w, 401, "unauthorized", "Inicia sesión")
			return
		}
		sum := sha256.Sum256([]byte(c.Value))
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		var s bson.M
		e = a.db.Collection("sessions").FindOne(ctx, bson.M{"tokenHash": hex.EncodeToString(sum[:]), "expiresAt": bson.M{"$gt": time.Now()}}).Decode(&s)
		if e != nil {
			fail(w, 401, "unauthorized", "Inicia sesión")
			return
		}
		var user bson.M
		if e = a.db.Collection("users").FindOne(ctx, bson.M{"_id": s["userId"], "active": true}).Decode(&user); e != nil {
			_, _ = a.db.Collection("sessions").DeleteOne(ctx, bson.M{"_id": s["_id"]})
			fail(w, 401, "unauthorized", "Inicia sesión")
			return
		}
		if r.Method != "GET" && !csrfOK(r) {
			fail(w, 403, "csrf_failed", "Solicitud no válida")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), authUserKey{}, s["userId"])))
	})
}
func (a *app) publicContent(w http.ResponseWriter, r *http.Request) {
	var doc state
	err := a.db.Collection("site_content").FindOne(r.Context(), bson.M{"_id": "main"}).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		jsonResponse(w, 200, state{Version: 1, Books: []any{}, Reviews: []any{}, Genres: []any{}, Series: []any{}, Settings: map[string]any{}})
		return
	}
	if err != nil {
		fail(w, 500, "server_error", "No se pudo cargar el contenido")
		return
	}
	normalizeState(&doc)
	doc.Reviews = publishedOnly(doc.Reviews)
	bookIDs := make(map[string]bool)
	for _, raw := range doc.Reviews {
		if id, ok := asMap(raw)["bookId"].(string); ok {
			bookIDs[id] = true
		}
	}
	books := make([]any, 0, len(bookIDs))
	for _, raw := range doc.Books {
		if id, ok := asMap(raw)["id"].(string); ok && bookIDs[id] {
			books = append(books, raw)
		}
	}
	doc.Books = books
	jsonResponse(w, 200, doc)
}

type reviewSEOPageData struct {
	Title         string
	Description   string
	SiteName      string
	Canonical     string
	BookTitle     string
	BookAuthor    string
	ReviewTitle   string
	PublishedAt   string
	Rating        string
	CoverURL      string
	ReviewContent htmltemplate.HTML
	JSONLD        htmltemplate.JS
}

var reviewSEOPageTemplate = htmltemplate.Must(htmltemplate.New("review-seo").Parse(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{.Title}}</title><meta name="description" content="{{.Description}}">
  <meta name="robots" content="index, follow"><link rel="canonical" href="{{.Canonical}}">
  <meta property="og:type" content="article"><meta property="og:site_name" content="{{.SiteName}}">
  <meta property="og:title" content="{{.Title}}"><meta property="og:description" content="{{.Description}}">
  <meta property="og:url" content="{{.Canonical}}"><meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{.Title}}"><meta name="twitter:description" content="{{.Description}}">
  {{if .CoverURL}}<meta property="og:image" content="{{.CoverURL}}"><meta name="twitter:image" content="{{.CoverURL}}">{{end}}
  {{if .PublishedAt}}<meta property="article:published_time" content="{{.PublishedAt}}">{{end}}
  <link rel="stylesheet" href="/assets/app.css"><link rel="icon" href="/favicon.svg">
  <script type="application/ld+json">{{.JSONLD}}</script>
  <style>
    :root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#07131c;color:#e1e7df}*{box-sizing:border-box}
    body{margin:0;line-height:1.7}a{color:#91b8c9}.seo-shell{max-width:920px;margin:auto;padding:36px 24px 80px}
    .seo-nav{display:flex;justify-content:space-between;gap:20px;padding:12px 0 32px;border-bottom:1px solid #294450}
    .seo-nav a:first-child{font:600 25px Georgia,serif;text-decoration:none;color:#e1e7df}
    article{max-width:720px;margin:50px auto 0}.seo-label{color:#a3bdb0;text-transform:uppercase;letter-spacing:.16em;font-size:12px}
    h1{font:600 clamp(38px,7vw,64px)/1.05 Georgia,serif;margin:16px 0 8px}h2{font:500 32px/1.2 Georgia,serif}
    .seo-author,.seo-meta{color:#a8b8be}.seo-excerpt{font:italic 22px/1.5 Georgia,serif;color:#91b8c9;margin:32px 0}
    .seo-cover{max-width:220px;max-height:320px;object-fit:cover;float:right;margin:0 0 24px 28px;border-radius:12px}
    .seo-content{font:18px/1.85 Georgia,serif}.seo-content img{max-width:100%;height:auto}.seo-content blockquote{border-left:2px solid #91b8c9;padding-left:20px;color:#a8b8be}
    @media(max-width:600px){.seo-shell{padding:20px 18px 56px}article{margin-top:34px}.seo-cover{max-width:130px;max-height:200px}}
  </style>
</head>
<body><main id="root"><div class="seo-shell">
  <nav class="seo-nav" aria-label="Navegación"><a href="/">{{.SiteName}}</a><a href="/resenas">Todas las reseñas</a></nav>
  <article>
    <p class="seo-label">Reseña literaria</p>
    {{if .CoverURL}}<img class="seo-cover" src="{{.CoverURL}}" alt="Portada de {{.BookTitle}}">{{end}}
    <h1>{{.BookTitle}}</h1><p class="seo-author">{{.BookAuthor}}</p>
    <p class="seo-meta">Calificación: {{.Rating}} de 5{{if .PublishedAt}} · Publicada el <time datetime="{{.PublishedAt}}">{{.PublishedAt}}</time>{{end}}</p>
    {{if .ReviewTitle}}<h2>{{.ReviewTitle}}</h2>{{end}}
    {{if .Description}}<p class="seo-excerpt">{{.Description}}</p>{{end}}
    <div class="seo-content">{{.ReviewContent}}</div>
  </article>
</div></main><script type="module" src="/assets/app.js"></script></body>
</html>`))

func (a *app) publicReviewHTML(w http.ResponseWriter, r *http.Request) {
	var doc state
	err := a.db.Collection("site_content").FindOne(r.Context(), bson.M{"_id": "main"}).Decode(&doc)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		http.Error(w, "No se pudo cargar la reseña", http.StatusInternalServerError)
		return
	}
	if err == nil {
		normalizeState(&doc)
	}
	page, redirectTo, found, err := buildReviewSEOPage(doc, r.PathValue("slug"), siteBaseURL())
	if err != nil {
		http.Error(w, "No se pudo generar la reseña", http.StatusInternalServerError)
		return
	}
	if redirectTo != "" {
		http.Redirect(w, r, redirectTo, http.StatusMovedPermanently)
		return
	}
	if !found {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=60, s-maxage=60")
	w.WriteHeader(http.StatusOK)
	if err := reviewSEOPageTemplate.Execute(w, page); err != nil {
		log.Printf("render review SEO page: %v", err)
	}
}

func buildReviewSEOPage(doc state, requestedSlug, siteURL string) (reviewSEOPageData, string, bool, error) {
	var review, book bson.M
	for _, raw := range doc.Reviews {
		candidate := asMap(raw)
		if candidate["status"] != "published" {
			continue
		}
		if stringValue(candidate["slug"]) == requestedSlug {
			review = candidate
			break
		}
		for _, alias := range stringValues(candidate["previousSlugs"]) {
			if alias == requestedSlug {
				return reviewSEOPageData{}, strings.TrimRight(siteURL, "/") + "/resenas/" + url.PathEscape(stringValue(candidate["slug"])), false, nil
			}
		}
	}
	if review == nil {
		return reviewSEOPageData{}, "", false, nil
	}
	bookID := stringValue(review["bookId"])
	for _, raw := range doc.Books {
		candidate := asMap(raw)
		if stringValue(candidate["id"]) == bookID {
			book = candidate
			break
		}
	}
	if book == nil {
		return reviewSEOPageData{}, "", false, nil
	}
	bookTitle := stringValue(book["title"])
	if bookTitle == "" {
		bookTitle = "Reseña literaria"
	}
	settings := doc.Settings
	siteName := stringValue(settings["siteName"])
	if siteName == "" {
		siteName = "Nia"
	}
	canonical := strings.TrimRight(siteURL, "/") + "/resenas/" + url.PathEscape(stringValue(review["slug"]))
	excerpt := plainSEOText(stringValue(review["excerpt"]))
	content := reviewContentPolicy().Sanitize(stringValue(review["content"]))
	contentText := plainSEOText(content)
	if excerpt == "" {
		excerpt = truncateRunes(contentText, 300)
	}
	date := stringValue(review["publishedAt"])
	if date == "" {
		date = stringValue(review["updatedAt"])
	}
	rating := numericValue(review["rating"])
	coverURL := publicSEOImage(stringValue(book["coverUrl"]), siteURL)
	profileName := stringValue(settings["profileName"])
	if profileName == "" {
		profileName = "Nia"
	}
	data := map[string]any{
		"@context": "https://schema.org", "@type": "Review", "name": bookTitle + " — reseña",
		"reviewBody": truncateRunes(contentText, 5000), "url": canonical,
		"author":       map[string]string{"@type": "Person", "name": profileName},
		"itemReviewed": map[string]any{"@type": "Book", "name": bookTitle, "author": map[string]string{"@type": "Person", "name": stringValue(book["author"])}},
		"reviewRating": map[string]any{"@type": "Rating", "ratingValue": rating, "bestRating": 5},
	}
	if date != "" {
		data["datePublished"] = date
	}
	if coverURL != "" {
		data["image"] = coverURL
	}
	jsonLD, err := json.Marshal(data)
	if err != nil {
		return reviewSEOPageData{}, "", false, err
	}
	return reviewSEOPageData{
		Title: bookTitle + " — reseña | " + siteName, Description: excerpt, SiteName: siteName, Canonical: canonical,
		BookTitle: bookTitle, BookAuthor: stringValue(book["author"]), ReviewTitle: stringValue(review["title"]),
		PublishedAt: date, Rating: fmt.Sprintf("%.1f", rating), CoverURL: coverURL,
		ReviewContent: htmltemplate.HTML(content), JSONLD: htmltemplate.JS(jsonLD),
	}, "", true, nil
}

func stringValues(value any) []string {
	var values []string
	switch items := value.(type) {
	case []any:
		for _, item := range items {
			if text, ok := item.(string); ok {
				values = append(values, text)
			}
		}
	case []string:
		values = items
	}
	return values
}

func numericValue(value any) float64 {
	switch number := value.(type) {
	case float64:
		return number
	case float32:
		return float64(number)
	case int:
		return float64(number)
	case int32:
		return float64(number)
	case int64:
		return float64(number)
	default:
		return 0
	}
}

func plainSEOText(value string) string {
	withoutTags := regexp.MustCompile(`<[^>]*>`).ReplaceAllString(value, " ")
	return strings.Join(strings.Fields(html.UnescapeString(withoutTags)), " ")
}

func truncateRunes(value string, limit int) string {
	runes := []rune(value)
	if len(runes) <= limit {
		return value
	}
	return strings.TrimSpace(string(runes[:limit]))
}

func publicSEOImage(image, siteURL string) string {
	image = strings.TrimSpace(image)
	parsed, err := url.Parse(image)
	if err != nil {
		return ""
	}
	if parsed.IsAbs() && (parsed.Scheme == "https" || parsed.Scheme == "http") && parsed.Host != "" {
		return image
	}
	if strings.HasPrefix(image, "/") && !strings.HasPrefix(image, "//") && !strings.HasPrefix(image, "/\\") {
		return strings.TrimRight(siteURL, "/") + image
	}
	return ""
}

func (a *app) publicSitemap(w http.ResponseWriter, r *http.Request) {
	var doc state
	err := a.db.Collection("site_content").FindOne(r.Context(), bson.M{"_id": "main"}).Decode(&doc)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		fail(w, 500, "server_error", "No se pudo generar el sitemap")
		return
	}
	urls := sitemapLocations(doc.Reviews, siteBaseURL())
	type urlEntry struct {
		Loc string `xml:"loc"`
	}
	type urlSet struct {
		XMLName xml.Name   `xml:"urlset"`
		Xmlns   string     `xml:"xmlns,attr"`
		URLs    []urlEntry `xml:"url"`
	}
	entries := make([]urlEntry, 0, len(urls))
	for _, loc := range urls {
		entries = append(entries, urlEntry{Loc: loc})
	}
	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=300")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(xml.Header))
	_ = xml.NewEncoder(w).Encode(urlSet{Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9", URLs: entries})
}

func (a *app) robotsTxt(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=300")
	_, _ = fmt.Fprintf(w, "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/v1/\nAllow: /api/v1/public/sitemap.xml\n\nSitemap: %s/api/v1/public/sitemap.xml\n", siteBaseURL())
}

func siteBaseURL() string {
	configured := strings.TrimRight(strings.TrimSpace(env("SITE_URL", "http://localhost:8443")), "/")
	parsed, err := url.Parse(configured)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return "http://localhost:8443"
	}
	return configured
}

func sitemapLocations(reviews []any, siteURL string) []string {
	siteURL = strings.TrimRight(siteURL, "/")
	urls := []string{siteURL + "/", siteURL + "/resenas", siteURL + "/generos", siteURL + "/colecciones", siteURL + "/sobre-nia", siteURL + "/privacidad"}
	for _, raw := range reviews {
		item := asMap(raw)
		if item["status"] != "published" {
			continue
		}
		slug, ok := item["slug"].(string)
		if ok && strings.TrimSpace(slug) != "" {
			urls = append(urls, siteURL+"/resenas/"+url.PathEscape(slug))
		}
	}
	return urls
}
func publishedOnly(in []any) []any {
	out := make([]any, 0)
	for _, v := range in {
		if asMap(v)["status"] == "published" {
			out = append(out, v)
		}
	}
	return out
}
func asMap(v any) bson.M {
	switch m := v.(type) {
	case bson.M:
		return m
	case map[string]any:
		return bson.M(m)
	case bson.D:
		out := bson.M{}
		for _, e := range m {
			out[e.Key] = e.Value
		}
		return out
	default:
		return bson.M{}
	}
}
func normalize(v any) any {
	switch x := v.(type) {
	case bson.D:
		m := map[string]any{}
		for _, e := range x {
			m[e.Key] = normalize(e.Value)
		}
		return m
	case bson.M:
		m := map[string]any{}
		for k, value := range x {
			m[k] = normalize(value)
		}
		return m
	case bson.A:
		out := make([]any, len(x))
		for i, value := range x {
			out[i] = normalize(value)
		}
		return out
	case []any:
		out := make([]any, len(x))
		for i, value := range x {
			out[i] = normalize(value)
		}
		return out
	default:
		return v
	}
}
func normalizeState(doc *state) {
	doc.Books = normalize(doc.Books).([]any)
	doc.Reviews = normalize(doc.Reviews).([]any)
	doc.Genres = normalize(doc.Genres).([]any)
	doc.Series = normalize(doc.Series).([]any)
	if doc.Settings == nil {
		doc.Settings = map[string]any{}
	} else if m, ok := normalize(doc.Settings).(map[string]any); ok {
		doc.Settings = m
	}
}
func (a *app) adminContent(w http.ResponseWriter, r *http.Request) {
	var doc state
	err := a.db.Collection("site_content").FindOne(r.Context(), bson.M{"_id": "main"}).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		jsonResponse(w, 200, state{Version: 1, Books: []any{}, Reviews: []any{}, Genres: []any{}, Series: []any{}, Settings: map[string]any{}})
		return
	}
	if err != nil {
		fail(w, 500, "server_error", "No se pudo cargar el contenido")
		return
	}
	normalizeState(&doc)
	jsonResponse(w, 200, doc)
}
func (a *app) saveContent(w http.ResponseWriter, r *http.Request) {
	var doc state
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 8<<20)).Decode(&doc) != nil {
		fail(w, 400, "invalid_request", "Contenido inválido")
		return
	}
	if len(doc.Reviews) > 10000 || len(doc.Books) > 10000 {
		fail(w, 413, "too_large", "Contenido demasiado grande")
		return
	}
	policy := reviewContentPolicy()
	for _, x := range doc.Reviews {
		if m, ok := x.(map[string]any); ok {
			if m["status"] != "draft" && m["status"] != "published" {
				fail(w, 422, "validation_failed", "Estado de reseña inválido")
				return
			}
			content, _ := m["content"].(string)
			m["content"] = policy.Sanitize(content)
			if m["status"] == "published" {
				if strings.TrimSpace(policy.Sanitize(content)) == "" {
					fail(w, 422, "validation_failed", "La reseña publicada necesita contenido")
					return
				}
			}
		}
	}
	_, err := a.db.Collection("site_content").ReplaceOne(r.Context(), bson.M{"_id": "main"}, bson.M{"_id": "main", "version": doc.Version, "books": doc.Books, "reviews": doc.Reviews, "genres": doc.Genres, "series": doc.Series, "settings": doc.Settings}, options.Replace().SetUpsert(true))
	if err != nil {
		fail(w, 500, "server_error", "No se pudo guardar")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func reviewContentPolicy() *bluemonday.Policy {
	return bluemonday.UGCPolicy().
		AllowElements("div", "figure", "figcaption", "span").
		AllowAttrs("data-spoiler").OnElements("div").
		AllowAttrs("src", "alt").OnElements("img").
		AllowAttrs("data-font").Matching(regexp.MustCompile(`^(times-new-roman|arial|georgia|verdana|tahoma|trebuchet-ms|courier-new|palatino|garamond|inter|cormorant-garamond)$`)).OnElements("span")
}
func (a *app) getWorkingCopy(w http.ResponseWriter, r *http.Request) {
	var doc bson.M
	e := a.db.Collection("review_working_copies").FindOne(r.Context(), bson.M{"userId": r.Context().Value(authUserKey{}), "reviewId": r.PathValue("id")}).Decode(&doc)
	if errors.Is(e, mongo.ErrNoDocuments) {
		w.WriteHeader(404)
		return
	}
	if e != nil {
		fail(w, 500, "server_error", "No se pudo recuperar el borrador")
		return
	}
	delete(doc, "_id")
	jsonResponse(w, 200, doc)
}
func (a *app) putWorkingCopy(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Form           map[string]any `json:"form"`
		WizardStep     int            `json:"wizardStep"`
		EditorPosition int            `json:"editorPosition"`
		ScrollPosition int            `json:"scrollPosition"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4<<20)).Decode(&in) != nil || in.Form == nil || in.WizardStep < 0 || in.WizardStep > 3 {
		fail(w, 400, "invalid_request", "Borrador inválido")
		return
	}
	id := r.PathValue("id")
	if id == "" {
		fail(w, 400, "invalid_request", "Falta el identificador")
		return
	}
	userID := r.Context().Value(authUserKey{})
	_, e := a.db.Collection("review_working_copies").ReplaceOne(r.Context(), bson.M{"userId": userID, "reviewId": id}, bson.M{"userId": userID, "reviewId": id, "form": in.Form, "wizardStep": in.WizardStep, "editorPosition": in.EditorPosition, "scrollPosition": in.ScrollPosition, "updatedAt": time.Now()}, options.Replace().SetUpsert(true))
	if e != nil {
		fail(w, 500, "server_error", "No se pudo guardar el borrador")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func (a *app) deleteWorkingCopy(w http.ResponseWriter, r *http.Request) {
	_, e := a.db.Collection("review_working_copies").DeleteOne(r.Context(), bson.M{"userId": r.Context().Value(authUserKey{}), "reviewId": r.PathValue("id")})
	if e != nil {
		fail(w, 500, "server_error", "No se pudo eliminar el borrador")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
