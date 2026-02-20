import DOMPurify from 'dompurify';

export const FIELD_LIMITS = {
  proposalTitle: 200,
  partnerName: 200,
  slug: 100,
  slideHeading: 300,
  slideBody: 5000,
  statLabel: 100,
  statValue: 50,
  featureTitle: 200,
  featureDescription: 500,
  testimonialQuote: 2000,
  contactField: 200,
  ctaText: 100,
  url: 2000,
} as const;

export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

export function sanitizeRichText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
  }).trim();
}

export function validateTextField(
  input: string,
  maxLength: number,
  fieldName: string,
): { value: string; error?: string } {
  const sanitized = sanitizeText(input);
  if (sanitized.length > maxLength) {
    return {
      value: sanitized.slice(0, maxLength),
      error: `${fieldName} truncated to ${maxLength} characters`,
    };
  }
  return { value: sanitized };
}

export function validateUrl(input: string): { value: string; isValid: boolean } {
  const trimmed = sanitizeText(input);
  if (!trimmed) {
    return { value: '', isValid: false };
  }

  if (!trimmed.startsWith('https://')) {
    return { value: trimmed, isValid: false };
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') {
      return { value: trimmed, isValid: false };
    }
    if (url.protocol === 'javascript:' || url.protocol === 'data:') {
      return { value: trimmed, isValid: false };
    }
    return { value: url.toString(), isValid: true };
  } catch {
    return { value: trimmed, isValid: false };
  }
}

export function generateSafeSlug(input: string): string {
  return sanitizeText(input)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, FIELD_LIMITS.slug);
}

export function validateImageUpload(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Use JPEG, PNG, GIF, WebP, or SVG.`,
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`,
    };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  const typeExtMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'image/svg+xml': ['svg'],
  };

  if (ext && typeExtMap[file.type] && !typeExtMap[file.type].includes(ext)) {
    return { valid: false, error: 'File extension does not match file type.' };
  }

  return { valid: true };
}

export async function sanitizeSvg(file: File): Promise<Blob> {
  const text = await file.text();
  const clean = DOMPurify.sanitize(text, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover'],
  });
  return new Blob([clean], { type: 'image/svg+xml' });
}
