package utils

import (
	"fmt"
	"math/rand"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// GenerateApplicationNumber builds a human-friendly, roughly-sortable
// application number, e.g. FCHST-2026-483920.
func GenerateApplicationNumber() string {
	year := time.Now().Year()
	return fmt.Sprintf("FCHST-%d-%06d", year, rand.Intn(999999))
}

// SaveUpload writes a multipart file to <uploadDir>/<subdir>/<uuid><ext> and
// returns the path relative to uploadDir (what gets stored in the DB).
func SaveUpload(fh *multipart.FileHeader, uploadDir, subdir string, maxMB int64) (string, error) {
	if fh.Size > maxMB*1024*1024 {
		return "", fmt.Errorf("file exceeds the %dMB limit", maxMB)
	}

	ext := strings.ToLower(filepath.Ext(fh.Filename))
	allowed := map[string]bool{".pdf": true, ".jpg": true, ".jpeg": true, ".png": true}
	if !allowed[ext] {
		return "", fmt.Errorf("unsupported file type %q — please upload a PDF, JPG or PNG", ext)
	}

	dir := filepath.Join(uploadDir, subdir)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}

	filename := uuid.NewString() + ext
	dst := filepath.Join(dir, filename)

	src, err := fh.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return "", err
	}
	defer out.Close()

	buf := make([]byte, 32*1024)
	for {
		n, rerr := src.Read(buf)
		if n > 0 {
			if _, werr := out.Write(buf[:n]); werr != nil {
				return "", werr
			}
		}
		if rerr != nil {
			break
		}
	}

	return filepath.Join(subdir, filename), nil
}
