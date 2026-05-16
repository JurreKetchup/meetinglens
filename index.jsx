"use client";
import { useState, useRef, useCallback } from "react";

function UploadZone({ onFile, file, disabled }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      className={`upload-zone ${dragging ? "drag-over" : ""} ${file ? "has-file" : ""} ${disabled ? "disabled" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.mp4,.webm,audio/*,video/*"
        style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      {file ? (
        <div className="file-info">
          <span className="file-icon">🎙</span>
          <span className="file-name">{file.name}</span>
          <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      ) : (
        <div className="upload-prompt">
          <span className="upload-icon">⬆</span>
          <p className="upload-text">Sleep je audio- of videobestand hierheen</p>
          <p className="upload-sub">of klik om te selecteren · MP3, WAV, M4A, MP4</p>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }) {
  const steps = ["Upload", "Transcriptie", "Samenvatting", "Klaar"];
  return (
    <div className="steps">
      {steps.map((s, i) => (
        <div key={s} className={`step ${i < step ? "done" : i === step ? "active" : ""}`}>
          <div className="step-dot">{i < step ? "✓" : i + 1}</div>
          <span>{s}</span>
          {i < steps.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );
}

function ResultCard({ icon, title, children }) {
  return (
    <div className="result-card">
      <h3 className="card-title"><span>{icon}</span>{title}</h3>
      {children}
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const reset = () => {
    setFile(null); setStep(0); setStatus("");
    setTranscript(""); setResult(null); setError(""); setShowTranscript(false);
  };

  const run = async () => {
    if (!file) return;
    setError(""); setResult(null); setTranscript("");

    try {
      // Stap 1: Transcriptie via onze eigen API route
      setStep(1);
      setStatus("Audio wordt getranscribeerd…");

      const formData = new FormData();
      formData.append("file", file);

      const txRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!txRes.ok) {
        const err = await txRes.json();
        throw new Error(err.error || "Transcriptie mislukt");
      }

      const { transcript: tx } = await txRes.json();
      setTranscript(tx);

      // Stap 2: Samenvatting via onze eigen API route
      setStep(2);
      setStatus("Claude analyseert de meeting…");

      const sumRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: tx }),
      });

      if (!sumRes.ok) {
        const err = await sumRes.json();
        throw new Error(err.error || "Samenvatting mislukt");
      }

      const summary = await sumRes.json();
      setResult(summary);
      setStep(3);
      setStatus("Analyse voltooid!");
    } catch (e) {
      setError(e.message);
      setStep(0);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=Bricolage+Grotesque:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #0f0e0d; --paper: #f5f2ed; --paper2: #ede9e2;
          --accent: #c8572b; --accent2: #2b6cc8; --green: #2a7a4b;
          --border: #d4cfc8; --radius: 12px;
        }
        body { background: var(--paper); color: var(--ink); font-family: 'Bricolage Grotesque', sans-serif; min-height: 100vh; }
        .app { max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }
        .header { margin-bottom: 48px; }
        .logo { font-family: 'Instrument Serif', serif; font-size: 2.4rem; letter-spacing: -0.02em; line-height: 1; margin-bottom: 8px; }
        .logo em { font-style: italic; color: var(--accent); }
        .tagline { font-size: 0.9rem; color: #6b6560; font-weight: 300; letter-spacing: 0.02em; }
        .steps { display: flex; align-items: center; margin-bottom: 36px; padding: 20px 24px; background: var(--paper2); border: 1px solid var(--border); border-radius: var(--radius); }
        .step { display: flex; align-items: center; gap: 8px; flex: 1; font-size: 0.78rem; font-weight: 500; color: #a09890; transition: color 0.3s; }
        .step.active { color: var(--ink); }
        .step.done { color: var(--green); }
        .step-dot { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-family: 'DM Mono', monospace; flex-shrink: 0; transition: all 0.3s; }
        .step.active .step-dot { background: var(--ink); color: var(--paper); border-color: var(--ink); }
        .step.done .step-dot { background: var(--green); color: white; border-color: var(--green); }
        .step-line { flex: 1; height: 1px; background: var(--border); margin: 0 4px; }
        .upload-zone { border: 2px dashed var(--border); border-radius: var(--radius); padding: 40px 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: white; margin-bottom: 20px; }
        .upload-zone:hover:not(.disabled) { border-color: var(--ink); background: var(--paper); }
        .upload-zone.drag-over { border-color: var(--accent); background: #fdf0eb; }
        .upload-zone.has-file { border-style: solid; border-color: var(--green); background: #f0faf5; }
        .upload-zone.disabled { opacity: 0.5; cursor: not-allowed; }
        .upload-icon { font-size: 2rem; display: block; margin-bottom: 12px; }
        .upload-text { font-weight: 500; margin-bottom: 4px; }
        .upload-sub { font-size: 0.82rem; color: #8a8480; }
        .file-info { display: flex; align-items: center; gap: 12px; justify-content: center; }
        .file-icon { font-size: 1.6rem; }
        .file-name { font-weight: 500; font-family: 'DM Mono', monospace; font-size: 0.85rem; }
        .file-size { font-size: 0.78rem; color: #8a8480; background: var(--paper2); padding: 2px 8px; border-radius: 20px; }
        .btn-row { display: flex; gap: 12px; }
        .btn { padding: 13px 28px; border-radius: 8px; border: none; font-family: 'Bricolage Grotesque', sans-serif; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.15s; letter-spacing: 0.01em; }
        .btn-primary { background: var(--ink); color: var(--paper); flex: 1; }
        .btn-primary:hover:not(:disabled) { background: #2a2825; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .btn-secondary { background: transparent; color: var(--ink); border: 1.5px solid var(--border); }
        .btn-secondary:hover { border-color: var(--ink); }
        .status-bar { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: #f0f4ff; border: 1px solid #c0cff8; border-radius: 8px; margin-top: 16px; font-size: 0.87rem; color: var(--accent2); font-weight: 500; }
        .spinner { width: 16px; height: 16px; border: 2px solid #c0cff8; border-top-color: var(--accent2); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-bar { padding: 14px 18px; background: #fff0ee; border: 1px solid #f0c0b8; border-radius: 8px; margin-top: 16px; font-size: 0.87rem; color: #b03020; font-weight: 500; }
        .results { margin-top: 40px; display: flex; flex-direction: column; gap: 20px; }
        .result-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; animation: fadeUp 0.4s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .result-card:nth-child(2) { animation-delay: 0.1s; }
        .result-card:nth-child(3) { animation-delay: 0.2s; }
        .card-title { font-family: 'Instrument Serif', serif; font-size: 1.2rem; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .summary-text { font-size: 0.95rem; line-height: 1.65; color: #2a2825; }
        .topic-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .topic-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; line-height: 1.5; padding: 10px 14px; background: var(--paper); border-radius: 8px; }
        .topic-bullet { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; flex-shrink: 0; margin-top: 7px; }
        .action-list { display: flex; flex-direction: column; gap: 10px; }
        .action-item { padding: 14px 16px; background: var(--paper); border-radius: 8px; border-left: 3px solid var(--accent2); }
        .action-task { font-size: 0.9rem; font-weight: 500; margin-bottom: 6px; }
        .action-meta { display: flex; gap: 16px; }
        .action-badge { font-size: 0.75rem; font-family: 'DM Mono', monospace; color: #6b6560; display: flex; align-items: center; gap: 4px; }
        .btn-ghost { background: none; border: 1px solid var(--border); padding: 8px 16px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-family: 'DM Mono', monospace; color: #6b6560; transition: all 0.15s; }
        .btn-ghost:hover { border-color: var(--ink); color: var(--ink); }
        .transcript-box { margin-top: 12px; padding: 16px; background: var(--paper2); border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 0.78rem; line-height: 1.7; color: #4a4540; max-height: 200px; overflow-y: auto; white-space: pre-wrap; }
        .success-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: #edf8f2; border: 1px solid #b0dfc0; border-radius: 20px; font-size: 0.78rem; color: var(--green); font-weight: 600; margin-bottom: 24px; }
      `}</style>

      <div className="app">
        <header className="header">
          <div className="logo">Meeting<em>Lens</em></div>
          <div className="tagline">Upload je meeting · Ontvang automatisch een samenvatting</div>
        </header>

        <StepIndicator step={step} />

        <UploadZone onFile={setFile} file={file} disabled={step > 0 && step < 3} />

        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={!file || (step > 0 && step < 3)}
            onClick={run}
          >
            {step > 0 && step < 3 ? "Bezig…" : "Analyseer meeting"}
          </button>
          {(file || result) && (
            <button className="btn btn-secondary" onClick={reset}>Reset</button>
          )}
        </div>

        {status && step > 0 && step < 3 && (
          <div className="status-bar">
            <div className="spinner" />
            {status}
          </div>
        )}

        {error && <div className="error-bar">⚠ {error}</div>}

        {result && (
          <div className="results">
            <div className="success-badge">✓ Analyse voltooid</div>

            <ResultCard icon="📋" title="Samenvatting">
              <p className="summary-text">{result.samenvatting}</p>
            </ResultCard>

            <ResultCard icon="🔑" title="Belangrijkste onderwerpen">
              <ul className="topic-list">
                {result.onderwerpen.map((t, i) => (
                  <li key={i} className="topic-item">
                    <span className="topic-bullet" />
                    {t}
                  </li>
                ))}
              </ul>
            </ResultCard>

            <ResultCard icon="✅" title="Actiepunten">
              <div className="action-list">
                {result.actiepunten.map((a, i) => (
                  <div key={i} className="action-item">
                    <div className="action-task">{a.taak}</div>
                    <div className="action-meta">
                      <span className="action-badge">👤 {a.eigenaar}</span>
                      <span className="action-badge">📅 {a.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ResultCard>

            {transcript && (
              <div style={{ marginTop: 24 }}>
                <button className="btn-ghost" onClick={() => setShowTranscript(v => !v)}>
                  {showTranscript ? "▲ Verberg transcript" : "▼ Toon volledig transcript"}
                </button>
                {showTranscript && <div className="transcript-box">{transcript}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
