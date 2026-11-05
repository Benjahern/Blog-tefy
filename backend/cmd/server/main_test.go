package main

import (
	"encoding/hex"
	"fmt"
	"strings"
	"testing"

	"golang.org/x/crypto/argon2"
)

func TestPublishedOnlyDoesNotExposeDrafts(t *testing.T) {
	items := []any{map[string]any{"id": "public", "status": "published"}, map[string]any{"id": "private", "status": "draft"}}
	out := publishedOnly(items)
	if len(out) != 1 || asMap(out[0])["id"] != "public" {
		t.Fatalf("unexpected public reviews: %#v", out)
	}
}

func TestSitemapContainsPublishedReviewsOnly(t *testing.T) {
	urls := sitemapLocations([]any{
		map[string]any{"slug": "public-review", "status": "published"},
		map[string]any{"slug": "private-draft", "status": "draft"},
	})
	if len(urls) != 7 || urls[6] != "https://nia.hmx.cl/resenas/public-review" {
		t.Fatalf("unexpected sitemap locations: %#v", urls)
	}
	for _, loc := range urls {
		if strings.Contains(loc, "private-draft") {
			t.Fatalf("draft leaked into sitemap: %s", loc)
		}
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
