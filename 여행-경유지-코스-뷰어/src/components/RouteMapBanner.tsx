import React, { useState } from 'react';
import { Waypoint } from '../types';
import { 
  Coffee, 
  Store, 
  Flame, 
  MapPin, 
  Camera, 
  Trees, 
  Utensils, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2,
  Sparkles, 
  ArrowRight,
  Compass
} from 'lucide-react';

interface RouteMapBannerProps {
  waypoints: Waypoint[];
  selectedId: string;
  onSelectWaypoint: (waypoint: Waypoint) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onViewAllRoute?: () => void;
}

export const RouteMapBanner: React.FC<RouteMapBannerProps> = ({
  waypoints,
  selectedId,
  onSelectWaypoint,
  isPlaying,
  onTogglePlay,
  onViewAllRoute
}) => {
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Sort waypoints by arrival order
  const sortedWaypoints = [...waypoints].sort((a, b) => a.order - b.order);

  // Helper to render icon by name
  const renderIcon = (name: Waypoint['iconName'], emoji: string) => {
    switch (name) {
      case 'Coffee':
        return <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />;
      case 'Store':
        return <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />;
      case 'Flame':
        return <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />;
      case 'Donut':
        return <span className="text-xs sm:text-sm leading-none">🥯</span>;
      case 'Camera':
        return <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />;
      case 'Trees':
        return <Trees className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />;
      case 'Utensils':
        return <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />;
      default:
        return emoji ? <span className="text-xs sm:text-sm">{emoji}</span> : <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />;
    }
  };

  // Build SVG path connecting waypoints in arrival order
  const generatePathD = () => {
    if (sortedWaypoints.length < 2) return '';
    return sortedWaypoints.reduce((path, pt, index) => {
      if (index === 0) {
        return `M ${pt.coordinates.x} ${pt.coordinates.y}`;
      }
      const prev = sortedWaypoints[index - 1];
      // Subtle smooth curve between stops
      const midX = (prev.coordinates.x + pt.coordinates.x) / 2;
      const midY = (prev.coordinates.y + pt.coordinates.y) / 2 + (index % 2 === 0 ? 5 : -5);
      return `${path} Q ${midX} ${midY}, ${pt.coordinates.x} ${pt.coordinates.y}`;
    }, '');
  };

  const selectedWaypoint = sortedWaypoints.find(w => w.id === selectedId) || sortedWaypoints[0];

  return (
    <div className="w-full bg-[#1e1c1b] rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-2xl border border-stone-800 relative overflow-hidden select-none">
      {/* Subtle map header status */}
      <div className="flex items-center justify-between px-1 sm:px-2 pb-2 text-xs text-stone-400 font-medium">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-stone-300 font-semibold tracking-wide text-[11px] sm:text-xs truncate">도착 순서 경로도</span>
          <span className="hidden sm:inline-block text-stone-500">|</span>
          <span className="hidden sm:inline-block text-stone-400">총 {sortedWaypoints.length}개소</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Map height expand toggle for mobile */}
          <button
            type="button"
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors cursor-pointer"
            title={isMapExpanded ? "지도 원래 크기로" : "지도 넓게 보기"}
          >
            {isMapExpanded ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span className="hidden xs:inline">축소</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span className="hidden xs:inline">지도확대</span>
              </>
            )}
          </button>

          {/* Auto tour button */}
          <button
            onClick={onTogglePlay}
            id="btn-auto-tour-toggle"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400/40'
                : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>일시정지</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>자동투어</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Map Stage Container (Styled to match the dark grid screenshot) */}
      <div 
        className={`relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#181614] border border-stone-800/80 shadow-inner transition-all duration-300 ease-in-out ${
          isMapExpanded 
            ? 'h-[320px] sm:h-[400px] md:h-[450px]' 
            : 'h-[210px] xs:h-[230px] sm:h-[290px] md:h-[340px]'
        }`}
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      >
        {/* Simulated Road Crossroads matching screenshot */}
        {/* Horizontal Main Avenue */}
        <div className="absolute top-[52%] left-0 right-0 h-8 sm:h-9 -translate-y-1/2 bg-stone-800/60 border-y border-stone-700/30 flex items-center overflow-hidden pointer-events-none">
          <div className="w-full border-t border-dashed border-stone-600/40"></div>
        </div>
        
        {/* Vertical Cross Road */}
        <div className="absolute top-0 bottom-0 left-[43%] w-8 sm:w-9 -translate-x-1/2 bg-stone-800/50 border-x border-stone-700/30 flex justify-center overflow-hidden pointer-events-none">
          <div className="h-full border-l border-dashed border-stone-600/40"></div>
        </div>

        {/* Secondary Diagonal Byway */}
        <div 
          className="absolute top-0 left-0 w-[140%] h-6 bg-stone-800/30 border-y border-stone-700/20 origin-top-left rotate-[12deg] pointer-events-none"
        ></div>

        {/* SVG Route Connector Path */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#fb923c" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
            </linearGradient>
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background glowing line */}
          <path
            d={generatePathD()}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="1.2"
            strokeDasharray="2 1.5"
            strokeLinecap="round"
            filter="url(#routeGlow)"
            className="opacity-80"
          />

          {/* Animated direction dash */}
          <path
            d={generatePathD()}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.8"
            strokeDasharray="1.5 3"
            strokeDashoffset="10"
            strokeLinecap="round"
            className="opacity-90 animate-[dash_20s_linear_infinite]"
          />
        </svg>

        {/* Waypoint Markers on the Map */}
        {sortedWaypoints.map((stop) => {
          const isSelected = stop.id === selectedId;
          return (
            <div
              key={stop.id}
              id={`waypoint-pin-${stop.id}`}
              style={{
                left: `${stop.coordinates.x}%`,
                top: `${stop.coordinates.y}%`,
              }}
              onClick={() => onSelectWaypoint(stop)}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-transform duration-300 p-1 -m-1 touch-manipulation active:scale-95"
            >
              {/* Outer pulsing ring for selected pin */}
              {isSelected && (
                <div className="absolute -inset-2.5 rounded-full bg-orange-500/35 animate-ping pointer-events-none" />
              )}

              <div className="flex flex-col items-center">
                {/* Pin Head (Round circular icon matching screenshot) */}
                <div 
                  className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                    isSelected
                      ? 'w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-white shadow-[0_0_18px_rgba(249,115,22,0.9)] ring-3 sm:ring-4 ring-orange-500 scale-110'
                      : 'w-8 h-8 xs:w-8.5 xs:h-8.5 sm:w-10 sm:h-10 bg-white/95 hover:bg-white shadow-lg ring-1.5 sm:ring-2 ring-stone-300/40 group-hover:scale-105 group-hover:ring-amber-400'
                  }`}
                >
                  {/* Arrival Order Badge (Numbered: 1, 2, 3, 4...) */}
                  <div 
                    className={`absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 min-w-4 h-4 sm:min-w-5 sm:h-5 px-0.5 sm:px-1 rounded-full flex items-center justify-center text-[9px] sm:text-[11px] font-black tracking-tight shadow-md z-30 transition-colors ${
                      isSelected
                        ? 'bg-orange-600 text-white ring-1 sm:ring-2 ring-white'
                        : 'bg-stone-900 text-amber-400 ring-1 ring-stone-700 group-hover:bg-orange-500 group-hover:text-white'
                    }`}
                  >
                    {stop.order}
                  </div>

                  {/* Category icon / emoji inside circular pin */}
                  <div className="flex items-center justify-center">
                    {renderIcon(stop.iconName, stop.iconEmoji)}
                  </div>

                  {/* Little bottom triangle pointer under the circle */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rotate-45 pointer-events-none shadow-sm" />
                </div>

                {/* Place Name Tag Bubble below pin */}
                <div 
                  className={`mt-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-tight whitespace-nowrap transition-all duration-200 shadow-lg max-w-[85px] xs:max-w-[110px] sm:max-w-[160px] truncate text-center ${
                    isSelected
                      ? 'bg-orange-500 text-white font-extrabold shadow-orange-950/50 scale-105 ring-1.5 sm:ring-2 ring-white/60'
                      : 'bg-white/95 text-stone-900 group-hover:bg-white group-hover:text-black group-hover:shadow-md'
                  }`}
                >
                  <span className="text-[9px] sm:text-[10px] font-semibold opacity-75 mr-0.5 text-inherit">#{stop.order}</span>
                  <span className="truncate">{stop.name}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Bottom Left Pill Chip */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 z-20 max-w-[55%] xs:max-w-[60%] sm:max-w-none">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-stone-200/80 text-stone-900 text-[10px] xs:text-xs sm:text-sm font-bold truncate">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></span>
            <span className="truncate">{selectedWaypoint.order}번 {selectedWaypoint.name}</span>
            <span className="hidden md:inline text-stone-400 font-normal">|</span>
            <span className="hidden md:inline text-stone-600 text-xs font-semibold">
              총 {sortedWaypoints.length}개 경유지
            </span>
          </div>
        </div>

        {/* Bottom Right Action Button - Touch target optimized */}
        <div className="absolute bottom-2.5 sm:bottom-4 right-2.5 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              const currentIndex = sortedWaypoints.findIndex(w => w.id === selectedId);
              const nextIndex = (currentIndex + 1) % sortedWaypoints.length;
              onSelectWaypoint(sortedWaypoints[nextIndex]);
            }}
            id="btn-next-stop-pill"
            className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2 min-h-[36px] sm:min-h-auto rounded-full bg-[#f97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs sm:text-sm font-black shadow-xl shadow-orange-950/40 active:scale-95 transition-all cursor-pointer"
          >
            <span>다음</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

