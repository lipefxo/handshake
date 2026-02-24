import type { ReactNode } from 'react';
import type { SlideType } from '../../types/proposal';

interface SlideTypeThumbnailProps {
  type: SlideType;
  isSelected?: boolean;
  className?: string;
}

export function SlideTypeThumbnail({ type, isSelected = false, className = '' }: SlideTypeThumbnailProps) {
  const fill = isSelected ? 'bg-[#d4785c]/80' : 'bg-gray-300';
  const softFill = isSelected ? 'bg-[#d4785c]/45' : 'bg-gray-200';
  const border = isSelected ? 'border-[#d4785c]/40 bg-[#d4785c]/10' : 'border-gray-200 bg-gray-50';

  const shapeByType: Partial<Record<SlideType, ReactNode>> = {
    // Centered headline + subline + logo block
    title: (
      <>
        <div className={`absolute left-3 right-3 top-2.5 h-1.5 rounded ${fill}`} />
        <div className={`absolute left-4 right-4 top-5 h-1 rounded ${softFill}`} />
        <div className={`absolute left-5 right-5 bottom-2 h-2.5 rounded ${fill}`} />
      </>
    ),
    // Image block + text stack
    intro: (
      <>
        <div className={`absolute left-2 top-2 bottom-2 w-[40%] rounded ${fill}`} />
        <div className={`absolute right-2 top-2 h-1.5 w-[42%] rounded ${fill}`} />
        <div className={`absolute right-2 top-5 h-1 w-[38%] rounded ${softFill}`} />
        <div className={`absolute right-2 top-7.5 h-1 w-[30%] rounded ${softFill}`} />
      </>
    ),
    // Rising bar chart
    stats: (
      <>
        <div className={`absolute left-2 bottom-2 h-3 w-3 rounded-sm ${softFill}`} />
        <div className={`absolute left-6 bottom-2 h-5 w-3 rounded-sm ${fill}`} />
        <div className={`absolute left-10 bottom-2 h-7 w-3 rounded-sm ${fill}`} />
      </>
    ),
    // 2×2 card grid
    features: (
      <>
        <div className={`absolute left-2 top-2 h-3 w-[38%] rounded ${softFill}`} />
        <div className={`absolute right-2 top-2 h-3 w-[38%] rounded ${softFill}`} />
        <div className={`absolute left-2 bottom-2 h-3 w-[38%] rounded ${fill}`} />
        <div className={`absolute right-2 bottom-2 h-3 w-[38%] rounded ${fill}`} />
      </>
    ),
    // Wide quote bars
    testimonial: (
      <>
        <div className={`absolute left-2 right-2 top-2.5 h-1 rounded ${softFill}`} />
        <div className={`absolute left-3 right-3 top-4.5 h-1 rounded ${softFill}`} />
        <div className={`absolute left-4 right-4 bottom-2.5 h-1 rounded ${fill}`} />
      </>
    ),
    // Two side-by-side columns + divider
    comparison: (
      <>
        <div className={`absolute left-2 top-2 bottom-2 w-[40%] rounded ${softFill}`} />
        <div className={`absolute right-2 top-2 bottom-2 w-[40%] rounded ${fill}`} />
      </>
    ),
    // Vertical spine + 3 dot nodes
    timeline: (
      <>
        <div className={`absolute left-[1.1rem] top-2 bottom-2 w-px ${softFill}`} />
        <div className={`absolute left-[0.75rem] top-2 h-1.5 w-1.5 rounded-full ${fill}`} />
        <div className={`absolute left-[0.75rem] top-[calc(50%-3px)] h-1.5 w-1.5 rounded-full ${fill}`} />
        <div className={`absolute left-[0.75rem] bottom-2 h-1.5 w-1.5 rounded-full ${fill}`} />
      </>
    ),
    // Full-bleed rectangle
    media: (
      <>
        <div className={`absolute inset-2 rounded ${fill}`} />
      </>
    ),
    // Stacked icon + label rows
    benefits: (
      <>
        <div className={`absolute left-2 top-2 h-1.5 w-1.5 rounded-full ${fill}`} />
        <div className={`absolute left-5 right-2 top-2 h-1.5 rounded ${fill}`} />
        <div className={`absolute left-2 top-5 h-1.5 w-1.5 rounded-full ${fill}`} />
        <div className={`absolute left-5 right-2 top-5 h-1.5 rounded ${softFill}`} />
      </>
    ),
    // Header row + grid lines
    table: (
      <>
        <div className={`absolute left-2 right-2 top-2 h-2 rounded-sm ${fill}`} />
        <div className={`absolute left-2 right-2 top-4.5 h-px ${softFill}`} />
        <div className={`absolute left-2 right-2 top-6.5 h-px ${softFill}`} />
        <div className={`absolute left-[36%] top-2 bottom-2 w-px ${softFill}`} />
        <div className={`absolute left-[66%] top-2 bottom-2 w-px ${softFill}`} />
      </>
    ),
    // Headline + sub + wide CTA button
    closing: (
      <>
        <div className={`absolute left-3 right-3 top-2 h-1.5 rounded ${fill}`} />
        <div className={`absolute left-4 right-4 top-5 h-1 rounded ${softFill}`} />
        <div className={`absolute left-3 right-3 bottom-2 h-3 rounded ${fill}`} />
      </>
    ),
  };

  const fallbackShape = (
    <>
      <div className={`absolute left-3 right-3 top-2 h-1.5 rounded ${fill}`} />
      <div className={`absolute left-3 right-3 top-5 h-1 rounded ${softFill}`} />
      <div className={`absolute left-3 right-3 top-7 h-1 rounded ${softFill}`} />
    </>
  );

  return (
    <div className={`relative h-9 w-11 overflow-hidden rounded-md border ${border} ${className}`}>
      {shapeByType[type] ?? fallbackShape}
    </div>
  );
}
