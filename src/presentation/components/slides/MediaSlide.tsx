import { motion } from 'motion/react';
import type { MediaSlideContent } from '../../../types/proposal';
import { useExportMode } from '../../../shared/contexts/ExportModeContext';
import { useTheme } from '../../../themes/useTheme';
import { OptimizedImage } from '../OptimizedImage';

interface MediaSlideProps {
  content: MediaSlideContent;
}

export function MediaSlide({ content }: MediaSlideProps) {
  const isExport = useExportMode();
  const hasMedia = !!content.url;
  const { theme } = useTheme();

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {hasMedia ? (
        <>
          {content.mediaType === 'video' ? (
            <video
              src={content.url}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: content.fit === 'contain' ? 'contain' : 'cover' }}
            />
          ) : (
            <motion.div
              className="absolute inset-0"
              initial={isExport ? { scale: 1 } : { scale: 1.05 }}
              animate={isExport ? { scale: 1 } : undefined}
              whileInView={isExport ? undefined : { scale: 1 }}
              viewport={isExport ? undefined : { once: true }}
              transition={isExport ? undefined : { duration: 8, ease: 'linear' }}
            >
              <OptimizedImage
                src={content.url}
                alt={content.caption || ''}
                className="w-full h-full"
                style={{ objectFit: content.fit === 'contain' ? 'contain' : 'cover' }}
              />
            </motion.div>
          )}
          {/* Overlay */}
          <div className="absolute inset-0" style={{ background: theme.colors.overlayBg, opacity: 0.2 }} />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'var(--color-bg-surface)' }}>
          <div className="text-center">
            <div className="text-4xl mb-4 opacity-30">▣</div>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
              No media uploaded yet
            </p>
          </div>
        </div>
      )}

      {content.caption && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-8 py-6"
          style={{ background: `linear-gradient(to top, ${theme.colors.overlayBg}, transparent)` }}
          initial={isExport ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={isExport ? { opacity: 1, y: 0 } : undefined}
          whileInView={isExport ? undefined : { opacity: 1, y: 0 }}
          viewport={isExport ? undefined : { once: true }}
          transition={isExport ? undefined : { delay: 0.5, duration: 0.6 }}
        >
          <p className="text-sm text-center" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}>
            {content.caption}
          </p>
        </motion.div>
      )}
    </div>
  );
}
