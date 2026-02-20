import { motion } from 'motion/react';
import type { MediaSlideContent } from '../../../types/proposal';

interface MediaSlideProps {
  content: MediaSlideContent;
}

export function MediaSlide({ content }: MediaSlideProps) {
  const hasMedia = !!content.url;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#000' }}>
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
            <motion.img
              src={content.url}
              alt={content.caption || ''}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: content.fit === 'contain' ? 'contain' : 'cover' }}
              initial={{ scale: 1.05 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 8, ease: 'linear' }}
            />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20" />
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
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <p className="text-white/80 text-sm text-center" style={{ fontFamily: 'var(--font-body)' }}>
            {content.caption}
          </p>
        </motion.div>
      )}
    </div>
  );
}
