/**
 * Four-way upload-input chooser used on the Business / Interview / Criminal
 * analysis pages. Picks the input modality so downstream UI can configure the
 * file picker accept filter and the API endpoint accordingly.
 */
import { motion } from "framer-motion";
import {
  FileAudio,
  FileVideo,
  FileImage,
  FileText,
  ChevronRight,
} from "lucide-react";

export type UploadKind = "audio" | "video" | "image" | "document";

interface InputTypeSelectorProps {
  onSelect: (kind: UploadKind) => void;
  isLoading?: boolean;
}

const OPTIONS: {
  kind: UploadKind;
  title: string;
  description: string;
  formats: string;
  Icon: typeof FileAudio;
  accent: string;
}[] = [
  {
    kind: "audio",
    title: "Audio",
    description:
      "Voice recording. Transcription, vocal stress, speech emotion, and credibility scoring.",
    formats: "MP3 · WAV · M4A · OGG · FLAC",
    Icon: FileAudio,
    accent: "from-emerald-500/20 to-emerald-500/5 ring-emerald-500/30 text-emerald-300",
  },
  {
    kind: "video",
    title: "Video",
    description:
      "Full multimodal pipeline — facial emotion across frames plus all voice signals.",
    formats: "MP4 · MOV · WebM · MKV",
    Icon: FileVideo,
    accent: "from-sky-500/20 to-sky-500/5 ring-sky-500/30 text-sky-300",
  },
  {
    kind: "image",
    title: "Image",
    description:
      "Still photo. Facial emotion only — no voice or transcript will be produced.",
    formats: "JPG · JPEG · PNG · WebP",
    Icon: FileImage,
    accent: "from-amber-500/20 to-amber-500/5 ring-amber-500/30 text-amber-300",
  },
  {
    kind: "document",
    title: "Document",
    description:
      "PDF or Word file. We extract the text, then run language-based credibility analysis.",
    formats: "PDF · DOCX · DOC · TXT",
    Icon: FileText,
    accent: "from-purple-500/20 to-purple-500/5 ring-purple-500/30 text-purple-300",
  },
];

export default function InputTypeSelector({ onSelect, isLoading }: InputTypeSelectorProps) {
  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[0.65rem] uppercase tracking-wider text-slate-300 mb-3">
          Choose what to upload
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          What are you analysing?
        </h2>
        <p className="text-slate-400 mt-2 max-w-xl mx-auto">
          Pick the type of file you have. Each input runs a different slice of
          the pipeline.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.kind}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 + i * 0.05 }}
            whileHover={{ y: -3 }}
            disabled={isLoading}
            onClick={() => !isLoading && onSelect(opt.kind)}
            className="group relative text-left rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/25 transition-all overflow-hidden p-6 disabled:opacity-50"
          >
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${opt.accent.split(" ")[0]} ${opt.accent.split(" ")[1]}`}
            />
            <div className="relative flex items-start gap-4">
              <div
                className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${opt.accent} ring-1 grid place-items-center flex-shrink-0`}
              >
                <opt.Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold tracking-tight mb-1">
                  {opt.title}
                </h3>
                <p className="text-slate-300/80 text-sm leading-relaxed mb-3">
                  {opt.description}
                </p>
                <p className="text-[0.7rem] uppercase tracking-wider text-slate-500">
                  {opt.formats}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
