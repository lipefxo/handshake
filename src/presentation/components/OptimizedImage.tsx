import { useCallback, useState, type ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
}

export function OptimizedImage({
  priority = false,
  loading,
  fetchPriority,
  decoding,
  className,
  onLoad,
  ...imgProps
}: OptimizedImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<ImgHTMLAttributes<HTMLImageElement>['src']>(undefined);
  const isLoaded = loadedSrc === imgProps.src;
  const imageRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) {
      setLoadedSrc(imgProps.src);
    }
  }, [imgProps.src]);

  const mergedClassName = `${className ?? ''} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`.trim();

  return (
    <img
      ref={imageRef}
      {...imgProps}
      className={mergedClassName}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={fetchPriority ?? (priority ? 'high' : 'auto')}
      decoding={decoding ?? 'async'}
      onLoad={(event) => {
        setLoadedSrc(imgProps.src);
        onLoad?.(event);
      }}
    />
  );
}
