import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { CloudUpload, FileCheck, X } from "lucide-react";

export type UploaderKind = "audio" | "video" | "image" | "document" | "any";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  /** Optional controlled file (for callers that manage state externally). */
  selectedFile?: File | null;
  /** Restrict the picker to a specific media kind. */
  kind?: UploaderKind;
}

const ACCEPT_BY_KIND: Record<UploaderKind, string> = {
  audio: "audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac",
  video: "video/*,.mp4,.mov,.webm,.mkv",
  image: "image/*,.jpg,.jpeg,.png,.webp",
  document: ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain",
  any: "audio/*,video/*,.mp4,.mov,.webm,.wav,.mp3,.m4a,.ogg,.flac,.aac",
};

const LABEL_BY_KIND: Record<UploaderKind, string> = {
  audio: "MP3 · WAV · M4A · OGG · FLAC",
  video: "MP4 · MOV · WebM · MKV",
  image: "JPG · JPEG · PNG · WebP",
  document: "PDF · DOC · DOCX · TXT",
  any: "Audio or video — WAV · MP3 · M4A · MP4 · MOV · WebM",
};

/**
 * Drag-and-drop file picker — matches the dark glass design system.
 */
export default function FileUploader({ onFileSelect, kind = "any" }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handle(files[0]);
  };
  const handle = (f: File) => {
    setSelectedFile(f);
    onFileSelect(f);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <motion.div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ y: -2 }}
        className={`relative overflow-hidden rounded-3xl p-10 text-center cursor-pointer transition-all border-2 ${
          isDragging
            ? "border-emerald-400 bg-emerald-500/10"
            : "border-dashed border-white/15 bg-white/[0.02] hover:border-emerald-400/40 hover:bg-white/[0.04]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) handle(f);
          }}
          accept={ACCEPT_BY_KIND[kind]}
          aria-label="Select file to upload"
          className="hidden"
        />

        <motion.div
          animate={{ y: isDragging ? -6 : 0, scale: isDragging ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="inline-flex h-16 w-16 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-300 items-center justify-center mb-5"
        >
          <CloudUpload className="h-8 w-8" />
        </motion.div>

        <h3 className="text-2xl font-bold tracking-tight">
          {selectedFile ? (
            <span className="bg-gradient-to-r from-emerald-300 to-sky-400 bg-clip-text text-transparent break-words">
              {selectedFile.name}
            </span>
          ) : (
            <>
              Drop a file or{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-sky-400 bg-clip-text text-transparent">
                browse
              </span>
            </>
          )}
        </h3>
        <p className="text-slate-400 text-sm mt-2">
          {selectedFile ? "Ready for analysis" : LABEL_BY_KIND[kind]}
        </p>

        {isDragging && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-emerald-300 font-semibold text-sm"
          >
            ↓ Drop to upload ↓
          </motion.p>
        )}
      </motion.div>

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 grid place-items-center flex-shrink-0">
              <FileCheck className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-medium truncate">{selectedFile.name}</div>
              <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                {selectedFile.type ? ` · ${selectedFile.type}` : ""}
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
            className="h-8 w-8 rounded-lg bg-white/[0.06] hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 grid place-items-center transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
