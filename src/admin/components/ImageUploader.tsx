import { useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { AppIcon } from '../../shared/icons/AppIcon';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}

export function ImageUploader({ value, onChange, label = 'Image', accept = 'image/*' }: ImageUploaderProps) {
  const { user } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file || !user) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('proposal-assets')
      .upload(path, file, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('proposal-assets')
      .getPublicUrl(data.path);

    onChange(publicUrl);
    setUploading(false);
  };

  const handleFile = (file: File) => {
    uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
          />
          <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              Replace
            </button>
            <button
              onClick={() => onChange('')}
              className="text-xs text-white bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
            dragOver
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          ) : (
            <>
              <AppIcon icon="ui.image" className="w-5 h-5 text-gray-300" />
              <span className="text-xs text-gray-400">Click or drag to upload</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
