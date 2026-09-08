import React, { useState } from 'react';
import { Waypoint, TransitType } from '../types';
import { X, Footprints, Car, Bus, Train, Bike, ArrowRight, Check, Sparkles } from 'lucide-react';

interface EditTransitModalProps {
  fromStop: Waypoint;
  toStop: Waypoint;
  isOpen: boolean;
  onClose: () => void;
  onSave: (toStopId: string, transitType: TransitType, distanceFromPrev: string) => void;
}

interface TransitOption {
  type: TransitType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultDist: string;
}

const TRANSIT_OPTIONS: TransitOption[] = [
  { type: 'walk', label: '도보', icon: Footprints, defaultDist: '도보 6분 (400m)' },
  { type: 'car', label: '자가용 / 택시', icon: Car, defaultDist: '차량 8분 (2.5km)' },
  { type: 'bus', label: '버스 / 대중교통', icon: Bus, defaultDist: '버스 12분 (3정거장)' },
  { type: 'subway', label: '지하철', icon: Train, defaultDist: '지하철 15분 (2역 이동)' },
  { type: 'bike', label: '자전거 / 따릉이', icon: Bike, defaultDist: '자전거 7분 (1.5km)' },
];

const QUICK_PRESETS: { label: string; transit: TransitType; text: string }[] = [
  { label: '도보 5분', transit: 'walk', text: '도보 5분 (350m)' },
  { label: '도보 10분', transit: 'walk', text: '도보 10분 (700m)' },
  { label: '도보 15분', transit: 'walk', text: '도보 15분 (1.0km)' },
  { label: '차량 5분', transit: 'car', text: '차량 5분 (1.8km)' },
  { label: '차량 10분', transit: 'car', text: '차량 10분 (3.5km)' },
  { label: '차량 20분', transit: 'car', text: '차량 20분 (7.2km)' },
  { label: '버스 10분', transit: 'bus', text: '버스 10분 (2정거장)' },
  { label: '지하철 15분', transit: 'subway', text: '지하철 15분 (2개역)' },
  { label: '자전거 8분', transit: 'bike', text: '자전거 8분 (1.6km)' },
];

export const EditTransitModal: React.FC<EditTransitModalProps> = ({
  fromStop,
  toStop,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedType, setSelectedType] = useState<TransitType>(toStop.transitType || 'walk');
  const [distanceText, setDistanceText] = useState(toStop.distanceFromPrev || '도보 6분 (380m)');

  if (!isOpen) return null;

  const handleSelectType = (type: TransitType) => {
    setSelectedType(type);
    const matched = TRANSIT_OPTIONS.find((o) => o.type === type);
    if (matched && (!distanceText || distanceText === '출발 지점' || distanceText === '이전 경유지에서 이동')) {
      setDistanceText(matched.defaultDist);
    }
  };

  const handleApplyPreset = (preset: { transit: TransitType; text: string }) => {
    setSelectedType(preset.transit);
    setDistanceText(preset.text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(toStop.id, selectedType, distanceText.trim() || '이동 10분');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-stone-200 max-w-md w-full my-0 sm:my-8 max-h-[92vh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto mb-2 sm:hidden shrink-0" />

        <button
          type="button"
          id="btn-close-edit-transit-modal"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Section Header */}
        <div className="mb-3">
          <span className="text-[11px] font-extrabold text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
            구간 이동방법 설정
          </span>
          <h3 className="text-base sm:text-lg font-black text-stone-900 mt-1">
            경유지 간 이동방법 & 소요시간 수정
          </h3>
        </div>

        {/* Route visualization preview */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200 mb-4">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-black flex items-center justify-center shrink-0">
              #{fromStop.order}
            </span>
            <span className="text-xs font-bold text-stone-800 truncate">
              {fromStop.iconEmoji} {fromStop.name}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 text-orange-500 shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
            <span className="text-xs font-bold text-stone-800 truncate text-right">
              {toStop.iconEmoji} {toStop.name}
            </span>
            <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
              #{toStop.order}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transit Type Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              이동 수단 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TRANSIT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleSelectType(opt.type)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                      isSelected
                        ? 'bg-orange-50 text-orange-950 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distance and Duration Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              이동 소요시간 및 거리 표시 문구
            </label>
            <input
              type="text"
              id="input-distance-from-prev"
              required
              value={distanceText}
              onChange={(e) => setDistanceText(e.target.value)}
              placeholder="예: 도보 7분 (450m) 또는 차량 12분 (3.5km)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3 h-3 text-orange-500" />
              빠른 시간·거리 추천 프리셋
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer active:scale-95 ${
                    distanceText === p.text
                      ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              id="btn-cancel-edit-transit"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer active:scale-95 touch-manipulation text-center"
            >
              취소
            </button>
            <button
              type="submit"
              id="btn-save-transit-method"
              className="flex-2 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2.5 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-black shadow-lg shadow-orange-600/25 transition-all cursor-pointer active:scale-95 touch-manipulation text-center"
            >
              <Check className="w-4 h-4" />
              <span>이동방법 적용</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
