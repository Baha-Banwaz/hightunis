"use client";

// The last resort: a failure in the root layout itself, which app/error.tsx
// sits inside and therefore cannot catch. It must render its own <html> and
// <body>, and cannot use the site's fonts or CSS, so the styling is inline.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#ffffff",
          color: "#000000",
          fontFamily: "Helvetica, Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <p style={{ fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", opacity: 0.4, fontWeight: 700 }}>
            Error
          </p>
          <h1 style={{ fontSize: "clamp(2.5rem,9vw,5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 0.95, margin: "0.5rem 0 1.5rem" }}>
            HighTunis is down
          </h1>
          <p style={{ fontSize: "1.125rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            The site failed to start. This is our fault, not yours. Please try again shortly.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ background: "#000", color: "#fff", border: 0, padding: "1rem 2.5rem", fontSize: 12, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}
          >
            Try again
          </button>

          {/*
            Next assigns a digest to every server error and logs the stack under
            it. Showing the digest is what makes a report actionable: it is the
            one string that ties what a visitor saw to the entry in the Vercel
            logs. It reveals nothing about the failure itself.
          */}
          {error.digest && (
            <p style={{ marginTop: "2.5rem", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", opacity: 0.4, fontWeight: 700 }}>
              Reference {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
