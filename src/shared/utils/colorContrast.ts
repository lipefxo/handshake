const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;
const RGB_COLOR = /^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/i;

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseColorToRgb(color: string): [number, number, number] | null {
  const normalized = color.trim();
  if (HEX_COLOR.test(normalized)) {
    const raw = normalized.replace('#', '');
    return [
      Number.parseInt(raw.slice(0, 2), 16),
      Number.parseInt(raw.slice(2, 4), 16),
      Number.parseInt(raw.slice(4, 6), 16),
    ];
  }

  const rgbMatch = normalized.match(RGB_COLOR);
  if (rgbMatch) {
    return [
      clampChannel(Number.parseInt(rgbMatch[1], 10)),
      clampChannel(Number.parseInt(rgbMatch[2], 10)),
      clampChannel(Number.parseInt(rgbMatch[3], 10)),
    ];
  }

  return null;
}

function relativeLuminance(color: string): number | null {
  const rgb = parseColorToRgb(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(colorA: string, colorB: string): number | null {
  const lumA = relativeLuminance(colorA);
  const lumB = relativeLuminance(colorB);
  if (lumA === null || lumB === null) return null;
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function pickBestContrastingText(
  backgroundColor: string,
  darkText = '#0B0F14',
  lightText = '#F8FAFC',
): string {
  const darkContrast = contrastRatio(darkText, backgroundColor);
  const lightContrast = contrastRatio(lightText, backgroundColor);
  if (darkContrast === null || lightContrast === null) {
    return lightText;
  }
  return darkContrast >= lightContrast ? darkText : lightText;
}
