import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_COURSES } from './data/mockCourses';
import { TravelCourse, Waypoint, PhotoItem, TransitType } from './types';
import { Header } from './components/Header';
import { RouteMapBanner } from './components/RouteMapBanner';
import { ArrivalOrderBar } from './components/ArrivalOrderBar';
import { StopPhotoViewer } from './components/StopPhotoViewer';
import { PhotoLightbox } from './components/PhotoLightbox';
import { AddStopModal } from './components/AddStopModal';
import { EditCourseModal } from './components/EditCourseModal';
import { EditWaypointModal } from './components/EditWaypointModal';
import { EditTransitModal } from './components/EditTransitModal';
import { 
  MapPin, 
  Sparkles, 
  Compass, 
  HelpCircle, 
  CheckCircle2, 
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Edit3
} from 'lucide-react';

export default function App() {
  const [courses, setCourses] = useState<TravelCourse[]>(() => {
    const saved = localStorage.getItem('travel_courses_data_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    }
    return INITIAL_COURSES;
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string>(INITIAL_COURSES[0].id);
  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Selected stop
  const [selectedStopId, setSelectedStopId] = useState<string>(() => {
    return currentCourse.waypoints[0]?.id || 'stop-1';
  });

  // Ensure valid selected stop when switching courses
  useEffect(() => {
    if (!currentCourse.waypoints.some((w) => w.id === selectedStopId)) {
      setSelectedStopId(currentCourse.waypoints[0]?.id || '');
    }
  }, [selectedCourseId, currentCourse]);

  // Save courses to localStorage on update
  useEffect(() => {
    localStorage.setItem('travel_courses_data_v1', JSON.stringify(courses));
  }, [courses]);

  // Auto-play state
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Photo lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Add stop modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit modals state
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isEditWaypointOpen, setIsEditWaypointOpen] = useState(false);
  const [editingTransitStops, setEditingTransitStops] = useState<{ from: Waypoint; to: Waypoint } | null>(null);

  // Sort waypoints by arrival order
  const sortedWaypoints = [...currentCourse.waypoints].sort((a, b) => a.order - b.order);
  const currentWaypointIndex = sortedWaypoints.findIndex((w) => w.id === selectedStopId);
  const selectedWaypoint = sortedWaypoints[currentWaypointIndex] || sortedWaypoints[0];

  // Auto-tour player
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setSelectedStopId((prevId) => {
          const idx = sortedWaypoints.findIndex((w) => w.id === prevId);
          const nextIdx = (idx + 1) % sortedWaypoints.length;
          return sortedWaypoints[nextIdx].id;
        });
      }, 4000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, sortedWaypoints]);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'ArrowRight') {
        handleNextWaypoint();
      } else if (e.key === 'ArrowLeft') {
        handlePrevWaypoint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWaypointIndex, sortedWaypoints]);

  // Prev / Next actions
  const handlePrevWaypoint = () => {
    if (currentWaypointIndex > 0) {
      setSelectedStopId(sortedWaypoints[currentWaypointIndex - 1].id);
    }
  };

  const handleNextWaypoint = () => {
    if (currentWaypointIndex < sortedWaypoints.length - 1) {
      setSelectedStopId(sortedWaypoints[currentWaypointIndex + 1].id);
    }
  };

  const handleSelectWaypoint = (stop: Waypoint) => {
    setSelectedStopId(stop.id);
  };

  // Add new stop to current course
  const handleAddWaypoint = (newWaypoint: Waypoint) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id === selectedCourseId) {
          return {
            ...c,
            waypoints: [...c.waypoints, newWaypoint],
          };
        }
        return c;
      })
    );
    setSelectedStopId(newWaypoint.id);
  };

  // Update course metadata (theme, title, description, region, distance, duration)
  const handleSaveCourse = (updatedCourse: TravelCourse) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
    );
  };

  // Update waypoint details (name, subtitle, category, arrival/stay times, address, description, etc.)
  const handleSaveWaypoint = (updatedWaypoint: Waypoint) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id === selectedCourseId) {
          return {
            ...c,
            waypoints: c.waypoints.map((w) => (w.id === updatedWaypoint.id ? updatedWaypoint : w)),
          };
        }
        return c;
      })
    );
  };

  // Update transit method and distance between two stops
  const handleSaveTransit = (toStopId: string, transitType: TransitType, distanceFromPrev: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id === selectedCourseId) {
          return {
            ...c,
            waypoints: c.waypoints.map((w) =>
              w.id === toStopId ? { ...w, transitType, distanceFromPrev } : w
            ),
          };
        }
        return c;
      })
    );
  };

  // Reset to initial courses
  const handleResetCourses = () => {
    if (window.confirm('기본 예시 코스로 초기화하시겠습니까?')) {
      setCourses(INITIAL_COURSES);
      setSelectedCourseId(INITIAL_COURSES[0].id);
      setSelectedStopId(INITIAL_COURSES[0].waypoints[0].id);
      localStorage.removeItem('travel_courses_data_v1');
    }
  };

  // Lightbox controls
  const handleOpenLightbox = (photo: PhotoItem, index: number) => {
    setLightboxPhoto(photo);
    setLightboxIndex(index);
  };

  const handleLightboxPrev = () => {
    if (!selectedWaypoint) return;
    const newIdx = lightboxIndex > 0 ? lightboxIndex - 1 : selectedWaypoint.photos.length - 1;
    setLightboxIndex(newIdx);
    setLightboxPhoto(selectedWaypoint.photos[newIdx]);
  };

  const handleLightboxNext = () => {
    if (!selectedWaypoint) return;
    const newIdx = lightboxIndex < selectedWaypoint.photos.length - 1 ? lightboxIndex + 1 : 0;
    setLightboxIndex(newIdx);
    setLightboxPhoto(selectedWaypoint.photos[newIdx]);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 font-sans flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={(id) => {
          setSelectedCourseId(id);
          setIsPlaying(false);
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onResetCourse={handleResetCourses}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-7 flex flex-col gap-5 sm:gap-6">
        {/* Course Summary Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-orange-700 bg-orange-100/90 px-2.5 py-0.5 rounded-full border border-orange-200/70 flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-orange-600" />
                <span>{currentCourse.theme || '추천 테마 여행'}</span>
              </span>
              <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200/60">
                {currentCourse.region}
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs font-semibold text-stone-600">
                총 이동거리 {currentCourse.totalDistance}
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs font-semibold text-stone-600">
                {currentCourse.estimatedDuration}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {currentCourse.title}
              </h2>
              <button
                type="button"
                id="btn-edit-course-meta"
                onClick={() => setIsEditCourseOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 min-h-[32px] rounded-xl bg-white hover:bg-orange-50 active:bg-orange-100 text-stone-700 hover:text-orange-700 text-xs font-bold border border-stone-200 hover:border-orange-200 shadow-2xs transition-all cursor-pointer active:scale-95 touch-manipulation"
                title="코스 주제, 제목, 지역, 총 소요시간 수정"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                <span>주제·제목 수정</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
              {currentCourse.description}
            </p>
          </div>

          {/* Quick instructions chip */}
          <div className="flex items-center gap-2 text-xs font-bold text-stone-600 bg-white px-3.5 py-2 rounded-2xl border border-stone-200 shadow-sm shrink-0 self-start sm:self-auto">
            <span className="text-base leading-none">👇</span>
            <span>지도의 <strong>번호 아이콘</strong>을 누르면 하단에 사진이 표시됩니다</span>
          </div>
        </div>

        {/* 1. TOP INTERACTIVE ROUTE MAP BANNER (Styled directly matching the uploaded screenshot) */}
        <section aria-label="경유지 도착 순서 지도">
          <RouteMapBanner
            waypoints={currentCourse.waypoints}
            selectedId={selectedStopId}
            onSelectWaypoint={handleSelectWaypoint}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
          />
        </section>

        {/* 2. MIDDLE ARRIVAL ORDER STEPPER BAR */}
        <section aria-label="도착 순서 목록">
          <ArrivalOrderBar
            waypoints={currentCourse.waypoints}
            selectedId={selectedStopId}
            onSelectWaypoint={handleSelectWaypoint}
            onEditTransit={(from, to) => setEditingTransitStops({ from, to })}
          />
        </section>

        {/* 3. UNDERNEATH PHOTO & STOP DETAIL VIEW */}
        <section aria-label="선택된 경유지 사진 및 상세 정보" className="pb-16 sm:pb-0">
          {selectedWaypoint && (
            <StopPhotoViewer
              waypoint={selectedWaypoint}
              totalWaypointsCount={sortedWaypoints.length}
              onPrevWaypoint={handlePrevWaypoint}
              onNextWaypoint={handleNextWaypoint}
              hasPrev={currentWaypointIndex > 0}
              hasNext={currentWaypointIndex < sortedWaypoints.length - 1}
              onOpenPhotoLightbox={handleOpenLightbox}
              onEditWaypoint={() => setIsEditWaypointOpen(true)}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-stone-200/80 py-5 text-center text-xs text-stone-400 mt-6 pb-20 sm:pb-5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 여행 경유지 코스 뷰어 · 도착 순서 연동 인터랙티브 포토 맵</p>
          <div className="flex items-center gap-3 text-stone-500 font-medium">
            <span>키보드 방향키(◀, ▶) 및 모바일 스와이프로 사진/경유지 전환 가능</span>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Quick Navigation Bar (Sticky bottom) */}
      <nav 
        aria-label="모바일 하단 빠른 경유지 탐색 바"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2"
      >
        <button
          type="button"
          id="btn-mobile-nav-prev"
          onClick={handlePrevWaypoint}
          disabled={currentWaypointIndex <= 0}
          className={`flex items-center justify-center gap-1 px-3 py-2 min-h-[42px] rounded-xl text-xs font-bold transition-all ${
            currentWaypointIndex > 0
              ? 'bg-stone-100 active:bg-stone-200 text-stone-800 active:scale-95 touch-manipulation cursor-pointer'
              : 'bg-stone-50 text-stone-300 cursor-not-allowed'
          }`}
          aria-label="이전 경유지"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>이전</span>
        </button>

        <div className="flex flex-col items-center min-w-0 flex-1 px-1">
          <div className="flex items-center gap-1 text-[10px] font-black text-orange-600">
            <span>도착 #{selectedWaypoint.order}</span>
            <span className="text-stone-300">/</span>
            <span className="text-stone-400 font-medium">총 {sortedWaypoints.length}곳</span>
          </div>
          <span className="text-xs font-extrabold text-stone-900 truncate w-full text-center">
            {selectedWaypoint.iconEmoji} {selectedWaypoint.name}
          </span>
        </div>

        <button
          type="button"
          id="btn-mobile-nav-next"
          onClick={handleNextWaypoint}
          disabled={currentWaypointIndex >= sortedWaypoints.length - 1}
          className={`flex items-center justify-center gap-1 px-3 py-2 min-h-[42px] rounded-xl text-xs font-bold transition-all ${
            currentWaypointIndex < sortedWaypoints.length - 1
              ? 'bg-orange-500 active:bg-orange-600 text-white shadow-md shadow-orange-500/25 active:scale-95 touch-manipulation cursor-pointer'
              : 'bg-stone-50 text-stone-300 cursor-not-allowed'
          }`}
          aria-label="다음 경유지"
        >
          <span>다음</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>

      {/* Fullscreen Photo Lightbox Modal */}
      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          waypoint={selectedWaypoint}
          onClose={() => setLightboxPhoto(null)}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
        />
      )}

      {/* Add Stop Modal */}
      <AddStopModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddWaypoint={handleAddWaypoint}
        nextOrder={sortedWaypoints.length + 1}
      />

      {/* Edit Course & Theme Modal */}
      <EditCourseModal
        course={currentCourse}
        isOpen={isEditCourseOpen}
        onClose={() => setIsEditCourseOpen(false)}
        onSave={handleSaveCourse}
      />

      {/* Edit Waypoint Details Modal */}
      {selectedWaypoint && (
        <EditWaypointModal
          waypoint={selectedWaypoint}
          isOpen={isEditWaypointOpen}
          onClose={() => setIsEditWaypointOpen(false)}
          onSave={handleSaveWaypoint}
        />
      )}

      {/* Edit Transit Method & Distance Modal */}
      {editingTransitStops && (
        <EditTransitModal
          fromStop={editingTransitStops.from}
          toStop={editingTransitStops.to}
          isOpen={true}
          onClose={() => setEditingTransitStops(null)}
          onSave={handleSaveTransit}
        />
      )}
    </div>
  );
}
