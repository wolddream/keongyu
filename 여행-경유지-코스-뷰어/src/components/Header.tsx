import React from 'react';
import { TravelCourse } from '../types';
import { Compass, Plus, RotateCcw, Map, Navigation, Layers } from 'lucide-react';

interface HeaderProps {
  courses: TravelCourse[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onOpenAddModal: () => void;
  onResetCourse: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  courses,
  selectedCourseId,
  onSelectCourse,
  onOpenAddModal,
  onResetCourse,
}) => {
  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 transition-all shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: App Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-stone-900 to-stone-800 text-orange-400 flex items-center justify-center shadow-md border border-stone-700 shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-black text-stone-900 tracking-tight truncate">
                여행 경유지 뷰어
              </h1>
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                순서연동
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium hidden md:block truncate">
              번호와 장소를 확인하고 아이콘을 눌러 실시간 사진과 여행 정보를 탐색하세요
            </p>
          </div>
        </div>

        {/* Right Controls: Course Selector & Add Stop */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Preset Course Selector */}
          <div className="relative">
            <select
              id="select-course-preset"
              value={selectedCourseId}
              onChange={(e) => onSelectCourse(e.target.value)}
              className="pl-2.5 pr-7 py-2 sm:py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-[11px] sm:text-xs font-bold text-stone-800 hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer appearance-none max-w-[125px] sm:max-w-[190px] truncate"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Add Stop Button - 44px min touch target on mobile */}
          <button
            type="button"
            id="btn-open-add-stop"
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-2 sm:py-1.5 min-h-[40px] sm:min-h-auto rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">경유지 </span>
            <span>추가</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            id="btn-reset-courses"
            onClick={onResetCourse}
            className="p-2 sm:p-1.5 min-w-[38px] min-h-[38px] sm:min-w-auto sm:min-h-auto flex items-center justify-center rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            title="초기 코스로 되돌리기"
            aria-label="초기 코스로 되돌리기"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
