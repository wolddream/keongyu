import React, { useState, useEffect, useRef } from 'react';
import { Waypoint, PhotoItem } from '../types';
import { 
  MapPin, 
  Clock, 
  Star, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Info, 
  Sparkles,
  Tag,
  Share2,
  Navigation,
  Edit3,
  Footprints,
  Car,
  Bus,
  Train,
  Bike
} from 'lucide-react';

interface StopPhotoViewerProps {
  waypoint: Waypoint;
  totalWaypointsCount: number;
  onPrevWaypoint: () => void;
  onNextWaypoint: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onOpenPhotoLightbox: (photo: PhotoItem, index: number) => void;
  onEditWaypoint?: (waypoint: Waypoint) => void;
}

export const StopPhotoViewer: React.FC<StopPhotoViewerProps> = ({
  waypoint,
  totalWaypointsCount,
  onPrevWaypoint,
  onNextWaypoint,
  hasPrev,
  hasNext,
  onOpenPhotoLightbox,
  onEditWaypoint,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const getTransitIcon = (type?: string) => {
    switch (type) {
      case 'car':
        return <Car className="w-3.5 h-3.5 text-stone-700" />;
      case 'bus':
        return <Bus className="w-3.5 h-3.5 text-stone-700" />;
      case 'subway':
        return <Train className="w-3.5 h-3.5 text-stone-700" />;
      case 'bike':
        return <Bike className="w-3.5 h-3.5 text-stone-700" />;
      case 'walk':
      default:
        return <Footprints className="w-3.5 h-3.5 text-stone-700" />;
    }
  };

  // Touch swipe support for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Reset active photo index whenever the selected waypoint changes
  useEffect(() => {
    setActivePhotoIndex(0);
    setImgLoaded(false);
  }, [waypoint.id]);

  const currentPhoto = waypoint.photos[activePhotoIndex] || waypoint.photos[0];

  const handleCopyAddress = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(waypoint.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    // Threshold of 40px for swipe gesture
    if (diffX > 40) {
      // Swiped left -> next photo
      if (waypoint.photos.length > 1) {
        setActivePhotoIndex((prev) => (prev < waypoint.photos.length - 1 ? prev + 1 : 0));
      }
    } else if (diffX < -40) {
      // Swiped right -> prev photo
      if (waypoint.photos.length > 1) {
        setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : waypoint.photos.length - 1));
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getCategoryLabel = (category: Waypoint['category']) => {
    switch (category) {
      case 'cafe': return '카페 & 디저트';
      case 'convenience': return '편의점 & 간식';
      case 'bakery': return '베이커리 & 빵집';
      case 'restaurant': return '로컬 맛집 & 식당';
      case 'nature': return '자연 & 힐링 쉼터';
      case 'attraction': return '관광 명소 & 랜드마크';
      case 'shopping': return '쇼핑 & 라이프스타일';
      default: return '경유지';
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xl border border-stone-200/90 transition-all">
      {/* Top Bar with Sequence Info & Quick Prev/Next Buttons */}
      <div className="flex items-center justify-between gap-2 pb-3.5 sm:pb-5 border-b border-stone-100">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="flex items-center justify-center px-2.5 sm:px-3 py-1 rounded-full bg-orange-600 text-white font-extrabold text-[11px] sm:text-xs shadow-md shadow-orange-600/20 shrink-0">
            도착 #{waypoint.order}
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-stone-500 truncate">
            {totalWaypointsCount}곳 중 {waypoint.order}번째
          </span>
          <span className="hidden xs:inline-block w-1 h-1 rounded-full bg-stone-300 shrink-0"></span>
          <span className="hidden xs:inline-block text-[11px] sm:text-xs font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 shrink-0 truncate">
            {getCategoryLabel(waypoint.category)}
          </span>
        </div>

        {/* Step Prev / Next Buttons - 40px+ touch friendly */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id="btn-prev-waypoint"
            onClick={onPrevWaypoint}
            disabled={!hasPrev}
            className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 min-h-[36px] sm:min-h-auto rounded-xl text-xs font-bold transition-all ${
              hasPrev
                ? 'bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 cursor-pointer active:scale-95'
                : 'bg-stone-50 text-stone-300 cursor-not-allowed'
            }`}
            aria-label="이전 경유지"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">이전</span>
          </button>

          <button
            type="button"
            id="btn-next-waypoint"
            onClick={onNextWaypoint}
            disabled={!hasNext}
            className={`flex items-center justify-center gap-1 px-3 sm:px-3.5 py-1.5 min-h-[36px] sm:min-h-auto rounded-xl text-xs font-bold transition-all ${
              hasNext
                ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-md shadow-orange-500/20 cursor-pointer active:scale-95'
                : 'bg-stone-50 text-stone-300 cursor-not-allowed'
            }`}
            aria-label="다음 경유지"
          >
            <span>다음</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Layout: Photos on the left/top, Place Details on the right/bottom */}
      <div className="mt-4 sm:mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Column: Photo Showcase */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Main Hero Photo Container with touch swipe handlers */}
          <div 
            className="relative aspect-[16/10] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-stone-950 shadow-md group border border-stone-200 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Loading placeholder */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-stone-800 animate-pulse flex items-center justify-center text-stone-500 text-xs">
                사진 불러오는 중...
              </div>
            )}

            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || waypoint.name}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              referrerPolicy="no-referrer"
            />

            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

            {/* Top Photo Badges */}
            <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between z-10 gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span className="px-2 sm:px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold border border-white/20 flex items-center gap-1 shadow-sm shrink-0">
                  <span className="text-xs sm:text-sm leading-none">{waypoint.iconEmoji}</span>
                  <span className="truncate max-w-[100px] xs:max-w-none">{waypoint.name}</span>
                </span>
                {currentPhoto.tag && (
                  <span className="px-2 py-0.5 sm:py-1 rounded-full bg-orange-500/90 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold shadow-sm shrink-0">
                    {currentPhoto.tag}
                  </span>
                )}
                {(currentPhoto.gps || waypoint.gpsLocation) && (
                  <span className="px-2 py-0.5 sm:py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-sm shrink-0">
                    <Navigation className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-200" />
                    <span>GPS</span>
                  </span>
                )}
              </div>

              {/* Fullscreen view button - min 40px touch size */}
              <button
                type="button"
                id="btn-photo-fullscreen"
                onClick={() => onOpenPhotoLightbox(currentPhoto, activePhotoIndex)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 active:bg-black text-white flex items-center justify-center transition-all border border-white/20 shadow-sm cursor-pointer shrink-0 active:scale-95"
                title="사진 크게 보기"
                aria-label="사진 전체화면 보기"
              >
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Bottom Photo Caption */}
            <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 z-10 text-white">
              <p className="text-xs sm:text-sm font-semibold drop-shadow-md line-clamp-2 text-stone-100">
                {currentPhoto.caption}
              </p>
              <div className="flex items-center justify-between mt-1 text-[10px] sm:text-[11px] text-stone-300">
                <span>
                  사진 {activePhotoIndex + 1} / {waypoint.photos.length}
                </span>
                <span className="text-stone-400 text-[10px]">좌우 스와이프 지원 👈👉</span>
              </div>
            </div>

            {/* Photo Prev/Next Arrows overlay */}
            {waypoint.photos.length > 1 && (
              <>
                <button
                  type="button"
                  id="btn-prev-photo"
                  onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : waypoint.photos.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 active:scale-95 cursor-pointer z-10"
                  title="이전 사진"
                  aria-label="이전 사진"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="btn-next-photo"
                  onClick={() => setActivePhotoIndex((prev) => (prev < waypoint.photos.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 active:scale-95 cursor-pointer z-10"
                  title="다음 사진"
                  aria-label="다음 사진"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Photo Thumbnails Selector */}
          {waypoint.photos.length > 1 && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin smooth-scroll-touch">
              {waypoint.photos.map((photo, idx) => (
                <button
                  key={photo.id || idx}
                  type="button"
                  id={`thumbnail-${idx}`}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative w-14 h-12 xs:w-16 xs:h-14 sm:w-20 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer touch-manipulation active:scale-95 ${
                    activePhotoIndex === idx
                      ? 'border-orange-500 ring-2 ring-orange-500/30 scale-105'
                      : 'border-transparent opacity-65 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {photo.tag && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] sm:text-[9px] text-white text-center py-0.5 font-medium truncate">
                      {photo.tag}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Place Information & Travel Details */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            {/* Title, Icon & Rating */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-2xl shrink-0">{waypoint.iconEmoji}</span>
                  <h2 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight truncate">
                    {waypoint.name}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5 sm:mt-1">
                  {waypoint.subtitle}
                </p>
              </div>

              {/* Actions & Rating badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                {onEditWaypoint && (
                  <button
                    type="button"
                    id="btn-edit-selected-waypoint"
                    onClick={() => onEditWaypoint(waypoint)}
                    className="flex items-center gap-1 px-2.5 py-1 min-h-[34px] rounded-xl bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-700 text-xs font-bold border border-orange-200/80 transition-all cursor-pointer active:scale-95 touch-manipulation shadow-2xs"
                    title="장소명, 주제, 이동방법 수정"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                    <span>수정</span>
                  </button>
                )}

                <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 min-h-[34px] rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold shrink-0">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500 text-amber-500" />
                  <span>{waypoint.rating}</span>
                  <span className="text-stone-400 font-normal text-[10px] sm:text-xs">({waypoint.reviewCount})</span>
                </div>
              </div>
            </div>

            {/* Travel Time & Schedule Box */}
            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-stone-50 border border-stone-200/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-stone-500 font-bold truncate">도착 예정 시간</div>
                  <div className="text-xs font-black text-stone-900 truncate">{waypoint.arrivalTime}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-stone-500 font-bold truncate">체류 권장 시간</div>
                  <div className="text-xs font-black text-stone-900 truncate">{waypoint.stayDuration}</div>
                </div>
              </div>
            </div>

            {/* Transit Method & Distance Box */}
            {waypoint.distanceFromPrev && (
              <div className="mt-2 flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-stone-50/90 border border-stone-200/80 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                    {getTransitIcon(waypoint.transitType)}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-stone-500 font-bold shrink-0">이전 경유지에서:</span>
                    <span className="font-bold text-stone-800 text-[11px] sm:text-xs truncate">
                      {waypoint.distanceFromPrev}
                    </span>
                  </div>
                </div>
                {onEditWaypoint && (
                  <button
                    type="button"
                    onClick={() => onEditWaypoint(waypoint)}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 active:text-orange-800 hover:underline cursor-pointer shrink-0 ml-1 px-1 py-0.5"
                  >
                    이동방법 수정
                  </button>
                )}
              </div>
            )}

            {/* Address with copy button */}
            <div className="mt-2.5 sm:mt-3.5 flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-white border border-stone-200 text-xs text-stone-700">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                <span className="truncate font-medium text-[11px] sm:text-xs">{waypoint.address}</span>
              </div>
              <button
                type="button"
                id="btn-copy-address"
                onClick={handleCopyAddress}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 min-h-[32px] rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 text-[10px] sm:text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>복사</span>
                  </>
                )}
              </button>
            </div>

            {/* GPS Coordinates Badge if available */}
            {(waypoint.gpsLocation || currentPhoto.gps) && (
              <div className="mt-2 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] sm:text-xs text-emerald-900">
                <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold shrink-0">GPS:</span>
                <span className="font-mono font-medium truncate">
                  {(waypoint.gpsLocation || currentPhoto.gps)?.formattedText}
                </span>
                {(waypoint.gpsLocation || currentPhoto.gps)?.accuracy && (
                  <span className="text-[9px] sm:text-[10px] text-emerald-700 ml-auto shrink-0">
                    (±{(waypoint.gpsLocation || currentPhoto.gps)?.accuracy}m)
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mt-3.5 sm:mt-4">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-1">
                <Info className="w-3.5 h-3.5 text-stone-500" />
                장소 소개
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {waypoint.description}
              </p>
            </div>

            {/* Specialty Menus / Highlights */}
            {waypoint.specialtyMenu && waypoint.specialtyMenu.length > 0 && (
              <div className="mt-3.5 sm:mt-4">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-500" />
                  대표 메뉴 및 추천 포인트
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {waypoint.specialtyMenu.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-orange-50 text-orange-800 text-[11px] sm:text-xs font-semibold border border-orange-200/80"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Travel Tip */}
            {waypoint.tips && (
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2 sm:gap-2.5">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[11px] font-bold text-amber-900">여행 꿀팁</div>
                  <div className="text-[11px] sm:text-xs text-amber-800/90 leading-snug mt-0.5">{waypoint.tips}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
