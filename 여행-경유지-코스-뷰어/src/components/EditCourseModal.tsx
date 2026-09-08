import React, { useState } from 'react';
import { TravelCourse } from '../types';
import { X, Sparkles, MapPin, Compass, Clock, Navigation, Check } from 'lucide-react';

interface EditCourseModalProps {
  course: TravelCourse;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCourse: TravelCourse) => void;
}

const THEME_PRESETS = [
  '☕ 감성 카페 & 디저트',
  '🍽️ 로컬 맛집 투어',
  '🥐 빵지순례 베이커리',
  '🌿 도심 힐링 & 산책',
  '🚗 드라이브 & 명소',
  '📸 인생샷 감성 여행',
  '🌆 야경 & 데이트 코스',
  '🛍️ 문화 & 쇼핑 탐방',
];

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  course,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(course.title);
  const [theme, setTheme] = useState(course.theme || '도심 힐링 & 맛집 코스');
  const [region, setRegion] = useState(course.region);
  const [description, setDescription] = useState(course.description);
  const [totalDistance, setTotalDistance] = useState(course.totalDistance);
  const [estimatedDuration, setEstimatedDuration] = useState(course.estimatedDuration);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...course,
      title: title.trim(),
      theme: theme.trim(),
      region: region.trim(),
      description: description.trim(),
      totalDistance: totalDistance.trim() || '3.5 km',
      estimatedDuration: estimatedDuration.trim() || '약 4시간',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl border border-stone-200 max-w-lg w-full my-0 sm:my-8 max-h-[92vh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto mb-2.5 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          type="button"
          id="btn-close-edit-course-modal"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900">
              여행 코스 주제 및 제목 수정
            </h3>
          </div>
        </div>
        <p className="text-xs text-stone-500 mb-4 sm:mb-5">
          현재 여행 코스의 주제, 제목, 지역 및 이동 거리 정보를 자유롭게 변경할 수 있습니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              코스 제목 <span className="text-orange-600">*</span>
            </label>
            <input
              type="text"
              id="input-course-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 단원구 도심 힐링 & 맛집 코스"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          {/* Course Theme (주제) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                여행 주제 (테마)
              </span>
              <span className="text-[10px] text-stone-400 font-normal">직접 입력 또는 선택</span>
            </label>
            <input
              type="text"
              id="input-course-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="예: 감성 카페 & 디저트 투어"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 mb-2"
            />
            {/* Theme Presets */}
            <div className="flex flex-wrap gap-1.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = theme === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTheme(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region and Distance/Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                지역 / 행정구역
              </label>
              <input
                type="text"
                id="input-course-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 경기 안산시 단원구"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-orange-500" />
                총 이동거리
              </label>
              <input
                type="text"
                id="input-course-distance"
                value={totalDistance}
                onChange={(e) => setTotalDistance(e.target.value)}
                placeholder="예: 3.8 km"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              예상 총 소요시간
            </label>
            <input
              type="text"
              id="input-course-duration"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="예: 약 5시간 30분"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              코스 상세 소개 설명
            </label>
            <textarea
              id="input-course-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="코스의 매력, 분위기, 추천 포인트를 입력하세요"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-normal text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              id="btn-cancel-edit-course"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer active:scale-95 touch-manipulation text-center"
            >
              취소
            </button>
            <button
              type="submit"
              id="btn-save-course-info"
              className="flex-2 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2.5 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-black shadow-lg shadow-orange-600/25 transition-all cursor-pointer active:scale-95 touch-manipulation text-center"
            >
              <Check className="w-4 h-4" />
              <span>코스 정보 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
