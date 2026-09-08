import React, { useState } from 'react';
import { Waypoint, CategoryType, TransitType } from '../types';
import { 
  X, 
  MapPin, 
  Clock, 
  Navigation, 
  Footprints, 
  Car, 
  Bus, 
  Train, 
  Bike, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';

interface EditWaypointModalProps {
  waypoint: Waypoint;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWaypoint: Waypoint) => void;
}

interface CategoryOption {
  type: CategoryType;
  label: string;
  emoji: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { type: 'cafe', label: '카페', emoji: '☕' },
  { type: 'restaurant', label: '맛집', emoji: '🥘' },
  { type: 'bakery', label: '베이커리', emoji: '🥐' },
  { type: 'convenience', label: '편의점', emoji: '🏪' },
  { type: 'attraction', label: '명소', emoji: '📸' },
  { type: 'nature', label: '자연/힐링', emoji: '🌿' },
  { type: 'shopping', label: '쇼핑', emoji: '🛍️' },
  { type: 'etc', label: '기타', emoji: '📍' },
];

const TRANSIT_OPTIONS: { type: TransitType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'walk', label: '도보', icon: Footprints },
  { type: 'car', label: '자가용/택시', icon: Car },
  { type: 'bus', label: '버스', icon: Bus },
  { type: 'subway', label: '지하철', icon: Train },
  { type: 'bike', label: '자전거', icon: Bike },
];

export const EditWaypointModal: React.FC<EditWaypointModalProps> = ({
  waypoint,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(waypoint.name);
  const [subtitle, setSubtitle] = useState(waypoint.subtitle);
  const [category, setCategory] = useState<CategoryType>(waypoint.category);
  const [iconEmoji, setIconEmoji] = useState(waypoint.iconEmoji);
  const [arrivalTime, setArrivalTime] = useState(waypoint.arrivalTime);
  const [stayDuration, setStayDuration] = useState(waypoint.stayDuration);
  const [transitType, setTransitType] = useState<TransitType>(waypoint.transitType || 'walk');
  const [distanceFromPrev, setDistanceFromPrev] = useState(waypoint.distanceFromPrev);
  const [address, setAddress] = useState(waypoint.address);
  const [description, setDescription] = useState(waypoint.description);
  const [tips, setTips] = useState(waypoint.tips || '');

  if (!isOpen) return null;

  const handleCategorySelect = (opt: CategoryOption) => {
    setCategory(opt.type);
    setIconEmoji(opt.emoji);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...waypoint,
      name: name.trim(),
      subtitle: subtitle.trim() || `${name.trim()} 여행 코스`,
      category,
      iconEmoji,
      arrivalTime: arrivalTime.trim() || '시간 협의',
      stayDuration: stayDuration.trim() || '1시간',
      transitType,
      distanceFromPrev: distanceFromPrev.trim() || '이동 10분',
      address: address.trim() || waypoint.address,
      description: description.trim() || waypoint.description,
      tips: tips.trim() || waypoint.tips,
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
        <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto mb-2 sm:hidden shrink-0" />

        <button
          type="button"
          id="btn-close-edit-waypoint-modal"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
            도착 순서 #{waypoint.order}
          </div>
          <h3 className="text-base sm:text-lg font-black text-stone-900">
            경유지 정보 및 이동방법 수정
          </h3>
        </div>
        <p className="text-xs text-stone-500 mb-4 sm:mb-5">
          장소명, 주제, 이동방법(도보/차량 등), 소요시간 및 소개글을 수정합니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          {/* Category & Emoji */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">카테고리 & 아이콘</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleCategorySelect(opt)}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                    category === opt.type
                      ? 'bg-orange-50 border-orange-500 text-orange-950 ring-2 ring-orange-500/20 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Place Name (Title) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              장소 제목 (명칭) <span className="text-orange-600">*</span>
            </label>
            <input
              type="text"
              id="input-waypoint-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 코코네 카페"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          {/* Subtitle / Theme */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              부제목 (주제 / 대표 특징)
            </label>
            <input
              type="text"
              id="input-waypoint-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="예: 스페셜티 드립커피 & 감성 테라스"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          {/* Transit Method & Distance/Duration from Previous Stop */}
          <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900">
              <Navigation className="w-3.5 h-3.5 text-orange-600" />
              <span>이전 경유지에서의 이동방법</span>
            </div>

            {/* Transit buttons */}
            <div className="grid grid-cols-5 gap-1">
              {TRANSIT_OPTIONS.map((t) => {
                const Icon = t.icon;
                const isSelected = transitType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => {
                      setTransitType(t.type);
                      if (distanceFromPrev === '출발 지점') {
                        setDistanceFromPrev(t.type === 'walk' ? '도보 6분 (380m)' : '차량 10분 (2.5km)');
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Distance / Duration text */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                이동 소요시간 및 거리 문구
              </label>
              <input
                type="text"
                id="input-waypoint-transit-dist"
                value={distanceFromPrev}
                onChange={(e) => setDistanceFromPrev(e.target.value)}
                placeholder="예: 도보 6분 (380m) 또는 차량 12분 (3.5km)"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Times: Arrival & Stay */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                도착 예정 시간
              </label>
              <input
                type="text"
                id="input-waypoint-arrival"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                placeholder="예: 01:30 PM"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                체류 권장 시간
              </label>
              <input
                type="text"
                id="input-waypoint-stay"
                value={stayDuration}
                onChange={(e) => setStayDuration(e.target.value)}
                placeholder="예: 1시간 30분"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              주소
            </label>
            <input
              type="text"
              id="input-waypoint-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예: 경기 안산시 단원구 예술대학로 42"
              className="w-full px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-stone-500" />
              장소 소개
            </label>
            <textarea
              id="input-waypoint-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 장소의 특징이나 분위기를 적어보세요."
              className="w-full px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-normal text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none"
            />
          </div>

          {/* Travel tips */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              여행 꿀팁
            </label>
            <input
              type="text"
              id="input-waypoint-tips"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="예: 창가 원목 테이블 자리가 채광이 좋습니다."
              className="w-full px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              id="btn-cancel-edit-waypoint"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer active:scale-95 touch-manipulation text-center"
            >
              취소
            </button>
            <button
              type="submit"
              id="btn-save-waypoint-info"
              className="flex-2 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2.5 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-black shadow-lg shadow-orange-600/25 transition-all cursor-pointer active:scale-95 touch-manipulation text-center"
            >
              <Check className="w-4 h-4" />
              <span>경유지 정보 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
