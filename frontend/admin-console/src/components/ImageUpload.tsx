import { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader } from 'lucide-react';

interface ImageUploadProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
  uploadFn?: (file: File) => Promise<string>;
  className?: string;
}

export default function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  accept = 'image/*',
  uploadFn,
  className = '',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);

  const allPreviews = value.length > 0 ? value : localPreviews;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = maxFiles - allPreviews.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);

    if (uploadFn) {
      setUploading(true);
      const uploaded: string[] = [];
      for (const f of selected) {
        try {
          const url = await uploadFn(f);
          uploaded.push(url);
        } catch {}
      }
      setUploading(false);
      onChange?.([...value, ...uploaded]);
    } else {
      const previews = selected.map((f) => URL.createObjectURL(f));
      setLocalPreviews((p) => [...p, ...previews]);
      onChange?.([...value, ...previews]);
    }
  };

  const removeImage = (idx: number) => {
    const newUrls = allPreviews.filter((_, i) => i !== idx);
    onChange?.(newUrls);
    setLocalPreviews(newUrls);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2 flex-wrap">
        {allPreviews.map((url, idx) => (
          <div key={idx} className="relative group">
            <img
              src={url}
              alt=""
              className="w-20 h-20 object-cover rounded-xl border border-gray-200"
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {allPreviews.length < maxFiles && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            {uploading ? (
              <Loader size={20} className="text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload size={18} className="text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Thêm</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-xs text-gray-400">
        {allPreviews.length}/{maxFiles} ảnh. Hỗ trợ kéo thả.
      </p>
    </div>
  );
}
