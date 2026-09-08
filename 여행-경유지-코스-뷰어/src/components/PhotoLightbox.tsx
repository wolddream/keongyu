import React, { useRef } from 'react';
import { PhotoItem, Waypoint } from '../types';
import { X, ChevronLeft, ChevronRight, Navigation } from 'lucide-react';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  waypoint: Waypoint | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  waypoint,
  onClose,
  onPrev,
  onNext,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  if (!photo || !waypoint) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diffX = touchStartX.current - touchEndX.current;
    if (diffX > 40 && onNext) {
      onNext();
    } else if (diffX < -40 && onPrev) {
      onPrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none"
      onClick={onClose}
    >
      {/* Close button - 44px touch target on mobile */}
      <button
        type="button"
        id="btn-close-lightbox"
        onClick={onClose}
        className="absolute top-3 right-3 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-colors z-30 cursor-pointer"
        aria-label="닫기"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Main Image Container */}
      <div 
        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full flex justify-center items-center">
          <img
            src={photo.url}
            alt={photo.caption}
            className="max-h-[70vh] sm:max-h-[76vh] w-auto max-w-full rounded-xl sm:rounded-2xl object-contain shadow-2xl border border-white/10"
            referrerPolicy="no-referrer"
          />

          {/* Prev/Next in Lightbox */}
          {onPrev && (
            <button
              type="button"
              id="btn-lightbox-prev"
              onClick={onPrev}
              className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 active:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 active:scale-95 cursor-pointer z-20"
              aria-label="이전 사진"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
          {onNext && (
            <button
              type="button"
              id="btn-lightbox-next"
              onClick={onNext}
              className="absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 active:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 active:scale-95 cursor-pointer z-20"
              aria-label="다음 사진"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* Caption bar */}
        <div className="mt-2.5 sm:mt-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-stone-900/90 backdrop-blur-md border border-white/10 text-center max-w-xl w-full">
          <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-orange-400">
            <span>{waypoint.order}번</span>
            <span>·</span>
            <span className="truncate">{waypoint.name}</span>
            {photo.tag && (
              <>
                <span>·</span>
                <span className="text-white/80 font-normal">{photo.tag}</span>
              </>
            )}
            {(photo.gps || waypoint.gpsLocation) && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[10px] sm:text-[11px]">
                  <Navigation className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {(photo.gps || waypoint.gpsLocation)?.formattedText}
                </span>
              </>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-200 mt-0.5 sm:mt-1 font-medium line-clamp-2">{photo.caption}</p>
        </div>
      </div>
    </div>
  );
};
