import imageCompression from 'browser-image-compression';

export type ImageContext = 'logo' | 'avatar' | 'slide-image' | 'media';

interface CompressionPreset {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  initialQuality: number;
}

const COMPRESSION_PRESETS: Record<ImageContext, CompressionPreset> = {
  logo: { maxSizeMB: 0.2, maxWidthOrHeight: 400, initialQuality: 0.85 },
  avatar: { maxSizeMB: 0.1, maxWidthOrHeight: 200, initialQuality: 0.82 },
  'slide-image': { maxSizeMB: 1, maxWidthOrHeight: 1920, initialQuality: 0.84 },
  media: { maxSizeMB: 1.5, maxWidthOrHeight: 1920, initialQuality: 0.84 },
};

const LOSSY_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const PASSTHROUGH_TYPES = new Set(['image/gif', 'image/svg+xml']);

function extensionFromMimeType(type: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };
  return map[type] ?? 'bin';
}

function updateFileNameExtension(fileName: string, nextType: string): string {
  const extension = extensionFromMimeType(nextType);
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) return `${fileName}.${extension}`;
  return `${fileName.slice(0, lastDot)}.${extension}`;
}

export async function compressImage(
  file: File,
  context: ImageContext,
  onProgress?: (progress: number) => void,
): Promise<File> {
  if (!file.type.startsWith('image/') || PASSTHROUGH_TYPES.has(file.type)) {
    return file;
  }

  if (!LOSSY_IMAGE_TYPES.has(file.type)) {
    return file;
  }

  const preset = COMPRESSION_PRESETS[context];
  const targetType = file.type === 'image/webp' ? 'image/webp' : 'image/webp';

  const compressed = await imageCompression(file, {
    maxSizeMB: preset.maxSizeMB,
    maxWidthOrHeight: preset.maxWidthOrHeight,
    initialQuality: preset.initialQuality,
    fileType: targetType,
    useWebWorker: true,
    onProgress,
  });

  if (compressed.size >= file.size) {
    return file;
  }

  const nextName = updateFileNameExtension(file.name, compressed.type);
  return new File([compressed], nextName, {
    type: compressed.type,
    lastModified: Date.now(),
  });
}
