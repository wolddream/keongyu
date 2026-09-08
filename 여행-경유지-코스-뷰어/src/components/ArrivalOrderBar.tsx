import React, { useEffect, useRef } from 'react';
import { Waypoint } from '../types';
import { 
  ArrowRight, 
  Clock, 
  MapPin, 
  Footprints, 
  Car, 
  Bus, 
  Train, 
  Bike, 
  Edit2,
  CheckCircle2, 
  Navigation, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface ArrivalOrderBarProps {
  waypoints: Waypoint[];
  selectedId: string;
  onSelectWaypoint: (stop: Waypoint) => void;
  onEditTransit?: (fromStop: Waypoint, toStop: Waypoint) => void;
}

export const ArrivalOrderBar: React.FC<ArrivalOrderBarProps> = ({
  waypoints,
  selectedId,
  onSelectWaypoint,
  onEditTransit,
}) => {
  const sorted = [...waypoints].sort((a, b) => a.order - b.order);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getTransitIcon = (type?: string) => {
    switch (type) {
      case 'car':
        return <Car className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-600" />;
      case 'bus':
        return <Bus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-600" />;
      case 'subway':
        return <Train className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-600" />;
      case 'bike':
        return <Bike className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-600" />;
      case 'walk':
      default:
        return <Footprints className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-600" />;
    }
  };

  // Auto-scroll selected stop into view smoothly on mobile
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(`#step-button-${selectedId}`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [selectedId]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-stone-200/90">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs sm:text-sm shrink-0">
            #
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-1.5 truncate">
              도착 순서별 경유지
              <span className="text-[10px] sm:text-[11px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200 shrink-0">
                탭하여 사진 전환
              </span>
            </h3>
          </div>
        </div>

        {/* Scroll helper buttons for fast thumb navigation */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] text-stone-400 font-medium hidden sm:inline mr-1">
            총 {sorted.length}곳
          </span>
          <button
            type="button"
            onClick={scrollLeft}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 active:bg-stone-100 text-stone-500 cursor-pointer"
            aria-label="이전 목록 보기"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 active:bg-stone-100 text-stone-500 cursor-pointer"
            aria-label="다음 목록 보기"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Sequential Stepper with touch snap */}
      <div 
        ref={scrollContainerRef}
        className="relative overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-200 smooth-scroll-touch snap-x snap-mandatory"
      >
        <div className="flex items-center min-w-max gap-2 sm:gap-3 py-0.5 px-0.5">
          {sorted.map((stop, index) => {
            const isSelected = stop.id === selectedId;
            const isLast = index === sorted.length - 1;

            return (
              <React.Fragment key={stop.id}>
                {/* Clickable Step Card - 44px min touch target */}
                <button
                  type="button"
                  id={`step-button-${stop.id}`}
                  onClick={() => onSelectWaypoint(stop)}
                  className={`group relative flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 min-h-[48px] rounded-xl border text-left transition-all duration-200 cursor-pointer snap-center touch-manipulation active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-50 to-amber-50/60 border-orange-400 shadow-md ring-2 ring-orange-400/20'
                      : 'bg-stone-50/80 hover:bg-stone-100/90 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Order Number & Icon container */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-base shadow-sm transition-transform group-hover:scale-105 ${
                        isSelected
                          ? 'bg-orange-500 text-white font-extrabold shadow-orange-500/20'
                          : 'bg-white text-stone-700 border border-stone-200'
                      }`}
                    >
                      <span>{stop.iconEmoji}</span>
                    </div>

                    {/* Small Order pill on corner */}
                    <span
                      className={`absolute -top-1 -left-1 px-1 py-0.1 rounded-full text-[9px] sm:text-[10px] font-black leading-tight shadow-sm ${
                        isSelected
                          ? 'bg-stone-900 text-white ring-1 ring-orange-300'
                          : 'bg-stone-700 text-stone-100'
                      }`}
                    >
                      {stop.order}
                    </span>
                  </div>

                  {/* Stop Name & Arrival Info */}
                  <div className="flex flex-col pr-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span
                        className={`text-xs sm:text-sm font-black tracking-tight truncate max-w-[110px] sm:max-w-[160px] ${
                          isSelected ? 'text-orange-950' : 'text-stone-800'
                        }`}
                      >
                        {stop.name}
                      </span>
                      {stop.gpsLocation && (
                        <span title={`GPS: ${stop.gpsLocation.formattedText}`}>
                          <Navigation className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        </span>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 fill-orange-100 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-stone-500 font-medium truncate">
                      <span>{stop.arrivalTime}</span>
                      <span>·</span>
                      <span className="text-stone-400">{stop.stayDuration}</span>
                    </div>
                  </div>
                </button>

                {/* Connecting Transit Arrow between stops - Clickable to edit */}
                {!isLast && (
                  <button
                    type="button"
                    onClick={() => onEditTransit?.(stop, sorted[index + 1])}
                    title={`이동방법 수정: ${stop.name} ➔ ${sorted[index + 1]?.name}`}
                    className="group/transit flex flex-col items-center justify-center px-1 py-1 rounded-xl hover:bg-orange-50/80 active:bg-orange-100/90 border border-transparent hover:border-orange-200 text-stone-400 hover:text-orange-600 shrink-0 transition-all cursor-pointer active:scale-95 touch-manipulation"
                  >
                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-stone-600 group-hover/transit:text-orange-800 bg-stone-100/90 group-hover/transit:bg-orange-100/80 px-1.5 py-0.5 rounded-md border border-stone-200/80 group-hover/transit:border-orange-300 mb-0.5 shadow-2xs transition-colors">
                      {getTransitIcon(sorted[index + 1]?.transitType)}
                      <span className="truncate max-w-[85px] sm:max-w-none">{sorted[index + 1]?.distanceFromPrev}</span>
                      <Edit2 className="w-2.5 h-2.5 text-stone-400 group-hover/transit:text-orange-600 ml-0.5" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover/transit:text-orange-500 transition-colors" />
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
