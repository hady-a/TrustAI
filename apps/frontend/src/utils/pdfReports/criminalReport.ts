/**
 * Criminal mode PDF generator — multi-page investigator report.
 *
 * Layout:
 *   Page 1 — Cover (title, IDs, headline scores)
 *   Page 2 — Sub-scores + behavioural signals
 *   Page 3 — Timeline (per-window stress + face emotion table)
 *   Page 4 — Recommendation + methodology disclaimer
 *
 * Reads the rich interpretation produced by CriminalMode.interpret().
 * Falls back gracefully when fields are absent.
 */

type AnyData = Record<string, any>;

export async function generateCriminalPDF(data: AnyData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const textWidth = pageWidth - margin * 2;

  const interpretation: AnyData =
    data.interpretation ??
    data.credibilityAnalysis?.interpretation ??
    {};
  const credibility: AnyData = data.credibilityAnalysis ?? {};
  const voice: AnyData = data.voiceAnalysis ?? {};
  const face: AnyData = data.faceAnalysis ?? {};

  const headline: AnyData = interpretation.headline ?? {};
  const subScores: AnyData = interpretation.sub_scores ?? {};
  const timeline: AnyData[] = interpretation.timeline ?? [];
  const signals: string[] =
    interpretation.behavioural_signals ??
    credibility.behavioral_signals ??
    [];
  const recommendation: string =
    interpretation.recommendation ??
    interpretation.mode_output?.alert ??
    "Behavioural indicators reviewed.";

  let y = 20;
  const heading = (label: string, size = 14) => {
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(size);
    pdf.setTextColor(20);
    pdf.text(label, margin, y);
    y += 8;
    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(60);
  };
  const line = (text: string, indent = 0) => {
    const lines = pdf.splitTextToSize(text, textWidth - indent);
    if (y + lines.length * 5 > 280) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(lines, margin + indent, y);
    y += lines.length * 5 + 2;
  };
  const sep = () => {
    pdf.setDrawColor(200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
  };
  const newPage = () => {
    pdf.addPage();
    y = 20;
  };

  // ============================================================ PAGE 1
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(20);
  pdf.text("Criminal Investigation Report", pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setFontSize(11);
  pdf.setTextColor(120);
  pdf.text("Behavioural Risk Assessment (not a deception verdict)", pageWidth / 2, y, {
    align: "center",
  });
  y += 12;
  sep();

  pdf.setFontSize(9);
  pdf.setTextColor(110);
  pdf.text(`Case ID: ${data.id ?? "—"}`, margin, y);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, y, {
    align: "right",
  });
  y += 6;
  pdf.text(`Mode: criminal`, margin, y);
  pdf.text(
    `Recorded: ${data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  y += 14;

  // Headline block
  heading("Headline assessment", 14);
  const riskLevel = (headline.risk_level ?? credibility.risk_level ?? "—") + "";
  const suspicion =
    headline.suspicion_score ??
    interpretation.mode_output?.focus?.suspicion_score ??
    null;
  const credScore = headline.credibility_score ?? credibility.credibility_score ?? null;

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(28);
  if (riskLevel === "HIGH") pdf.setTextColor(190, 30, 30);
  else if (riskLevel === "MEDIUM") pdf.setTextColor(190, 140, 30);
  else pdf.setTextColor(30, 140, 60);
  pdf.text(`Risk: ${riskLevel}`, margin, y);
  y += 12;
  pdf.setTextColor(20);
  pdf.setFontSize(14);
  pdf.setFont("Helvetica", "normal");
  if (suspicion !== null) pdf.text(`Suspicion score: ${suspicion} / 100`, margin, y);
  y += 8;
  if (credScore !== null) pdf.text(`Credibility score: ${Math.round(credScore)} / 100`, margin, y);
  y += 14;

  heading("Reading these numbers");
  line(
    "Risk level is a categorical label derived from multi-factor behavioural " +
      "indicators. Suspicion score (0–100) is the inverse of credibility, boosted " +
      "by stress and hesitation markers. Neither value is a verdict on truthfulness; " +
      "both should be interpreted as priorities for human follow-up."
  );

  // ============================================================ PAGE 2
  newPage();
  heading("Per-channel sub-scores", 14);
  const showScore = (label: string, value: any, suffix = "") => {
    if (value === undefined || value === null) return;
    line(`${label}: ${value}${suffix}`);
  };
  showScore("Vocal stress", subScores.vocal_stress, " / 100");
  showScore("Emotion–stress mismatch", subScores.emotion_stress_mismatch, " / 100");
  showScore("Facial instability", subScores.facial_instability, " / 100");
  showScore("Vocal jitter", subScores.vocal_jitter, " (relative %)");
  showScore("Hesitation markers", subScores.hesitation_count, "");
  if (subScores.timeline_peak_stress !== undefined)
    showScore("Peak windowed stress", subScores.timeline_peak_stress, " / 100");

  if (subScores.suspicious_patterns?.length) {
    y += 4;
    heading("Suspicious patterns detected", 12);
    subScores.suspicious_patterns.forEach((p: string) => line(`• ${p}`, 4));
  }

  if (signals.length) {
    y += 4;
    heading("Behavioural signals", 12);
    signals.forEach((s: string) => line(`• ${s}`, 4));
  }

  // ============================================================ PAGE 3
  newPage();
  heading("Per-moment timeline", 14);
  line(
    "Per-window measurements over the recording. Each row is a fixed-length " +
      "segment; the recording was analysed with a 3-second window. Use this to " +
      "identify segments worth re-listening to."
  );
  y += 4;

  // Table header
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(20);
  pdf.text("Start", margin, y);
  pdf.text("End", margin + 25, y);
  pdf.text("Stress (%)", margin + 50, y);
  pdf.text("Face emotion", margin + 90, y);
  pdf.text("Face conf.", margin + 140, y);
  y += 6;
  pdf.setDrawColor(180);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 4;
  pdf.setFont("Helvetica", "normal");
  pdf.setTextColor(60);

  if (timeline.length === 0) {
    line("(timeline not available for this analysis)", 4);
  } else {
    timeline.forEach((w: AnyData) => {
      if (y > 275) {
        newPage();
        heading("Per-moment timeline (continued)", 14);
      }
      const stress = w.stress ?? "—";
      const emotion = w.dominant_emotion ?? "—";
      const conf = w.face_confidence !== undefined ? w.face_confidence.toFixed(2) : "—";
      pdf.text(`${(w.t_start ?? 0).toFixed?.(1) ?? w.t_start}s`, margin, y);
      pdf.text(`${(w.t_end ?? 0).toFixed?.(1) ?? w.t_end}s`, margin + 25, y);
      pdf.text(`${stress}`, margin + 50, y);
      pdf.text(`${emotion}`, margin + 90, y);
      pdf.text(`${conf}`, margin + 140, y);
      y += 5;
    });
  }

  // ============================================================ PAGE 4
  newPage();
  heading("Recommendation", 14);
  line(recommendation);

  y += 6;
  heading("Voice analysis", 12);
  if (voice?.transcription?.transcript)
    line(`Transcript: "${(voice.transcription.transcript as string).slice(0, 500)}"`);
  if (voice?.emotion?.emotion) line(`Detected vocal emotion: ${voice.emotion.emotion}`);

  y += 6;
  heading("Face analysis", 12);
  if (face?.dominant_emotion) line(`Dominant facial emotion: ${face.dominant_emotion}`);
  if (face?.frames_analyzed) line(`Frames analysed: ${face.frames_analyzed}`);

  y += 8;
  heading("Methodology & limitations", 12);
  line(
    "This report uses calibrated behavioural indicators (vocal stress via " +
      "RMS energy, pitch jitter, voiced ratio and spectral centroid; facial " +
      "emotion via DeepFace; speech emotion via wav2vec2-SUPERB-ER; transcription " +
      "via Whisper). The credibility score and risk level are produced by a " +
      "weighted multi-factor fusion."
  );
  line(
    "No facial or vocal feature reliably indicates deception in the academic " +
      "literature (see Vrij 2008 and the iBorderCtrl critique). Outputs are " +
      "decision support — the final judgement requires human investigation and " +
      "independent corroboration."
  );

  pdf.save(`criminal-report-${data.id ?? "case"}.pdf`);
}
