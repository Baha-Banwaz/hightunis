"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export async function uploadImages(files: FileList | File[], folder: string): Promise<string[]> {
  const fd = new FormData();
  fd.append("folder", folder);
  Array.from(files).forEach((f) => fd.append("files", f));
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Upload failed");
  return data.urls as string[];
}

export function UploadButton({
  folder,
  multiple = false,
  label = "Upload",
  onUploaded,
}: {
  folder: string;
  multiple?: boolean;
  label?: string;
  onUploaded: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-2 border border-black/20 px-4 py-3 text-[10px] font-bold uppercase tracking-[2px] hover:bg-black hover:text-white transition-colors disabled:opacity-40 whitespace-nowrap"
      >
        <Upload size={13} /> {busy ? "Uploading..." : label}
      </button>
      {error && (
        <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={async (e) => {
          const files = e.target.files;
          if (!files?.length) return;
          setBusy(true);
          setError("");
          try {
            onUploaded(await uploadImages(files, folder));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          }
          setBusy(false);
          e.target.value = "";
        }}
      />
    </span>
  );
}

export default function ImageField({
  label,
  value,
  onChange,
  folder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  folder: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a URL or upload →"
          className="flex-1 border-2 border-black/20 px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
        />
        <UploadButton folder={folder} onUploaded={(urls) => onChange(urls[0])} />
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Preview"
          className="mt-3 h-32 w-full object-cover border border-black/20"
        />
      ) : null}
    </div>
  );
}
