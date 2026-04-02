"use client";

import { useState, useRef, useCallback } from "react";

type Mode = "screenshot" | "figma-copy" | "raw-html";

const MODES: { id: Mode; label: string; hint: string }[] = [
  {
    id: "screenshot",
    label: "Screenshot",
    hint: "Drag & drop or click to upload a Figma screenshot (PNG, JPG, WebP)",
  },
  {
    id: "figma-copy",
    label: "Figma Copy",
    hint: 'Paste the output of Figma\'s "Copy as SVG", "Copy as HTML", or any Figma export',
  },
  {
    id: "raw-html",
    label: "Raw HTML",
    hint: "Paste any existing HTML — it will be restructured for Webflow + Client-First",
  },
];

export default function ToolsPage() {
  const [mode, setMode] = useState<Mode>("screenshot");
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleConvert = async () => {
    if (mode === "screenshot" && !image) return;
    if ((mode === "figma-copy" || mode === "raw-html") && !text.trim()) return;

    setLoading(true);
    setOutput("");

    const formData = new FormData();
    formData.append("mode", mode);
    if (context.trim()) formData.append("context", context.trim());
    if (mode === "screenshot" && image) {
      formData.append("image", image);
    } else {
      formData.append("text", text);
    }

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setOutput(`/* Error: ${err instanceof Error ? err.message : "Unknown error"} */`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setText("");
    setImage(null);
    setImagePreview(null);
    setOutput("");
  };

  const canSubmit =
    !loading &&
    (mode === "screenshot" ? !!image : !!text.trim());

  return (
    <main
      className="tools-page"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-navy)",
        color: "var(--color-beige)",
        fontFamily: "var(--font-sans)",
        padding: "4rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              color: "var(--color-keyword)",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            treseiscero / tools
          </p>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: "0.75rem",
            }}
          >
            Figma → Webflow
          </h1>
          <p
            style={{
              color: "var(--color-beige-muted)",
              fontSize: "1rem",
              maxWidth: "520px",
              lineHeight: 1.6,
            }}
          >
            Convert Figma designs into Webflow-ready HTML with{" "}
            <span style={{ color: "var(--color-beige)" }}>Client-First</span>{" "}
            class naming. Screenshot, copy selection, or raw HTML — all accepted.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* ── Left: Input ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Mode Tabs */}
            <div
              style={{
                display: "flex",
                gap: "0",
                border: "1px solid rgba(249,249,241,0.12)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  style={{
                    flex: 1,
                    padding: "0.6rem 0.75rem",
                    background: mode === m.id ? "rgba(249,249,241,0.1)" : "transparent",
                    border: "none",
                    borderRight: "1px solid rgba(249,249,241,0.12)",
                    color: mode === m.id ? "var(--color-beige)" : "var(--color-beige-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.05em",
                    transition: "all 0.15s ease",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Hint */}
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                color: "var(--color-keyword)",
                lineHeight: 1.5,
                marginTop: "-0.25rem",
              }}
            >
              {MODES.find((m) => m.id === mode)?.hint}
            </p>

            {/* Input Area */}
            {mode === "screenshot" ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `1px dashed ${isDragging ? "var(--color-beige)" : "rgba(249,249,241,0.2)"}`,
                  borderRadius: "6px",
                  minHeight: "200px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "border-color 0.2s ease",
                  backgroundColor: isDragging ? "rgba(249,249,241,0.04)" : "transparent",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Selected screenshot"
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0.5rem",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "rgba(2,45,66,0.85)",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "4px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.65rem",
                        color: "var(--color-keyword)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Click to replace
                    </div>
                  </>
                ) : (
                  <>
                    <UploadIcon />
                    <p
                      style={{
                        marginTop: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        color: "var(--color-beige-muted)",
                        textAlign: "center",
                      }}
                    >
                      Drop image here or click to browse
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileInput}
                />
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mode === "figma-copy"
                    ? '<svg xmlns="http://www.w3.org/2000/svg"...\nor paste any Figma export'
                    : "<section>\n  <div class='hero'>\n    ...\n  </div>\n</section>"
                }
                style={{
                  width: "100%",
                  minHeight: "240px",
                  background: "rgba(249,249,241,0.03)",
                  border: "1px solid rgba(249,249,241,0.12)",
                  borderRadius: "6px",
                  padding: "0.875rem 1rem",
                  color: "var(--color-beige)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none",
                  cursor: "text",
                }}
              />
            )}

            {/* Context Input */}
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.68rem",
                  color: "var(--color-keyword)",
                  letterSpacing: "0.08em",
                  marginBottom: "0.4rem",
                }}
              >
                CONTEXT (optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. This is a hero section for a SaaS product. Use a 2-col layout with the image on the right."
                rows={2}
                style={{
                  width: "100%",
                  background: "rgba(249,249,241,0.03)",
                  border: "1px solid rgba(249,249,241,0.12)",
                  borderRadius: "6px",
                  padding: "0.625rem 0.875rem",
                  color: "var(--color-beige)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  resize: "none",
                  outline: "none",
                  cursor: "text",
                }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleConvert}
              disabled={!canSubmit}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: canSubmit ? "var(--color-beige)" : "rgba(249,249,241,0.1)",
                color: canSubmit ? "var(--color-navy)" : "var(--color-beige-muted)",
                border: "none",
                borderRadius: "6px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  GENERATING...
                </>
              ) : (
                "CONVERT →"
              )}
            </button>
          </div>

          {/* ── Right: Output ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.68rem",
                  color: "var(--color-keyword)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Output · Webflow HTML
              </span>
              {output && (
                <button
                  onClick={handleCopy}
                  style={{
                    padding: "0.3rem 0.75rem",
                    background: copied ? "rgba(249,249,241,0.15)" : "transparent",
                    border: "1px solid rgba(249,249,241,0.2)",
                    borderRadius: "4px",
                    color: copied ? "var(--color-beige)" : "var(--color-beige-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    transition: "all 0.15s ease",
                    letterSpacing: "0.05em",
                  }}
                >
                  {copied ? "✓ COPIED" : "COPY"}
                </button>
              )}
            </div>

            <div
              style={{
                position: "relative",
                minHeight: "480px",
                background: "rgba(249,249,241,0.02)",
                border: "1px solid rgba(249,249,241,0.08)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {!output && !loading && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <CodeIcon />
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      color: "var(--color-beige-muted)",
                    }}
                  >
                    HTML will appear here
                  </p>
                </div>
              )}
              <pre
                style={{
                  margin: 0,
                  padding: "1rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  lineHeight: 1.65,
                  color: "var(--color-beige)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowY: "auto",
                  maxHeight: "640px",
                  minHeight: "480px",
                }}
              >
                <code>{output}</code>
                {loading && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "2px",
                      height: "0.9em",
                      backgroundColor: "var(--color-beige)",
                      marginLeft: "1px",
                      verticalAlign: "text-bottom",
                      animation: "blink 1s step-end infinite",
                    }}
                  />
                )}
              </pre>
            </div>

            {output && (
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: "var(--color-keyword)",
                  lineHeight: 1.5,
                }}
              >
                Paste into Webflow Designer → Add Element → Embed (HTML Embed) or Custom Code.
                Classes reference your global Client-First stylesheet.
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        textarea:focus {
          border-color: rgba(249,249,241,0.3) !important;
        }
        textarea::placeholder {
          color: rgba(249,249,241,0.2);
        }
        @media (max-width: 700px) {
          .grid-2col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(249,249,241,0.3)" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(249,249,241,0.15)" strokeWidth="1.5">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
