import React, { useState, useRef, useEffect } from 'react';
import { Waypoint, CategoryType, GPSLocation, TransitType } from '../types';
import { 
  X, 
  Camera, 
  MapPin, 
  Upload, 
  Navigation, 
  Crosshair, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Trash2, 
  RotateCw, 
  Globe,
  Footprints,
  Car,
  Bus,
  Train,
  Bike
} from 'lucide-react';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWaypoint: (newWaypoint: Waypoint) => void;
  nextOrder: number;
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  onAddWaypoint,
  nextOrder,
}) => {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('cafe');
  const [arrivalTime, setArrivalTime] = useState('02:00 PM');
  const [stayDuration, setStayDuration] = useState('1시간');
  const [transitType, setTransitType] = useState<TransitType>('walk');
  const [distanceFromPrev, setDistanceFromPrev] = useState('도보 7분 (450m)');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [iconEmoji, setIconEmoji] = useState('☕');

  // GPS State
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Native camera file input fallback ref
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up camera on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  const categoryPresets: Array<{ type: CategoryType; label: string; emoji: string; iconName: Waypoint['iconName'] }> = [
    { type: 'cafe', label: '카페', emoji: '☕', iconName: 'Coffee' },
    { type: 'bakery', label: '베이커리', emoji: '🥯', iconName: 'Donut' },
    { type: 'restaurant', label: '식당/맛집', emoji: '🔥', iconName: 'Flame' },
    { type: 'convenience', label: '편의점', emoji: '🏪', iconName: 'Store' },
    { type: 'attraction', label: '관광지', emoji: '📸', iconName: 'Camera' },
    { type: 'nature', label: '자연/공원', emoji: '🌲', iconName: 'Trees' },
  ];

  const handleCategorySelect = (preset: typeof categoryPresets[0]) => {
    setCategory(preset.type);
    setIconEmoji(preset.emoji);
  };

  // --- GPS Location Logic ---
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('현재 브라우저에서 GPS 위치 기능을 지원하지 않습니다.');
      return;
    }

    setIsGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const formatted = `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`;
        const newGps: GPSLocation = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          timestamp: position.timestamp,
          formattedText: formatted,
        };
        setGpsLocation(newGps);
        setIsGpsLoading(false);

        // If address is empty, provide coordinate-based placeholder
        if (!address) {
          setAddress(`GPS 좌표 위치 (${formatted})`);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해 주세요.');
        } else {
          setGpsError('현재 GPS 신호를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // Fallback demo GPS simulation for test preview environments
  const handleUseDemoGps = () => {
    const lat = 37.3195 + (Math.random() - 0.5) * 0.01;
    const lng = 126.8309 + (Math.random() - 0.5) * 0.01;
    const formatted = `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
    setGpsLocation({
      latitude: lat,
      longitude: lng,
      accuracy: 8,
      timestamp: Date.now(),
      formattedText: formatted,
    });
    setGpsError(null);
    if (!address) {
      setAddress(`경기 안산시 단원구 (${formatted})`);
    }
  };

  // --- Camera Streaming & Capture Logic ---
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setCameraError(null);
    setIsCameraOpen(true);

    // Stop any existing stream
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 카메라 스트림을 지원하지 않습니다.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      setCameraError('카메라를 열 수 없습니다. 카메라 권한을 확인하거나 아래 버튼으로 촬영하세요.');
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const handleSwitchCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Create offscreen canvas to capture current video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoUrl(dataUrl);
      if (!photoCaption) {
        setPhotoCaption('카메라로 현장 직접 촬영한 사진');
      }
    }

    stopCamera();

    // If GPS not fetched yet, attempt to fetch location automatically
    if (!gpsLocation) {
      handleGetGpsLocation();
    }
  };

  // Image file upload (from gallery or native camera)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
          if (!photoCaption) {
            setPhotoCaption(`${file.name.replace(/\.[^/.]+$/, '')} 현장 사진`);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchedPreset = categoryPresets.find((p) => p.type === category);
    const finalPhotoUrl =
      photoUrl.trim() ||
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80';

    const newStop: Waypoint = {
      id: `custom-stop-${Date.now()}`,
      order: nextOrder,
      name: name.trim(),
      subtitle: subtitle.trim() || `${name.trim()} 여행 코스`,
      category,
      iconName: matchedPreset ? matchedPreset.iconName : 'MapPin',
      iconEmoji,
      coordinates: {
        x: Math.min(88, Math.max(15, 20 + nextOrder * 16)),
        y: Math.min(75, Math.max(25, 30 + ((nextOrder % 2 === 0 ? 1 : -1) * 15))),
      },
      gpsLocation: gpsLocation || undefined,
      arrivalTime,
      stayDuration,
      distanceFromPrev: distanceFromPrev.trim() || '이전 경유지에서 이동',
      transitType,
      address: address.trim() || (gpsLocation ? `GPS 좌표 (${gpsLocation.formattedText})` : '현장 방문지 주소'),
      description: description.trim() || `${name}의 멋진 풍경과 매력을 즐길 수 있는 추천 경유지입니다.`,
      specialtyMenu: ['추천 시그니처 메뉴/체험'],
      tips: gpsLocation
        ? `GPS 위치 확인 완료 (${gpsLocation.formattedText}). 현장 분위기를 여유롭게 감상해보세요.`
        : '여유롭게 둘러보며 기념 사진을 남겨보세요.',
      rating: 4.9,
      reviewCount: 1,
      photos: [
        {
          id: `photo-${Date.now()}`,
          url: finalPhotoUrl,
          caption: photoCaption.trim() || `${name}의 대표 전경 사진`,
          tag: gpsLocation ? 'GPS 인증 사진' : '현장 사진',
          gps: gpsLocation || undefined,
        },
      ],
    };

    onAddWaypoint(newStop);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl border border-stone-200 max-w-xl w-full my-0 sm:my-8 max-h-[92vh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle indicator */}
        <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto mb-2.5 sm:hidden shrink-0" />

        <button
          type="button"
          id="btn-close-add-modal"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
            도착 순서 #{nextOrder}
          </div>
          <h3 className="text-base sm:text-lg font-black text-stone-900">새 경유지 추가</h3>
        </div>
        <p className="text-[11px] sm:text-xs text-stone-500 mb-4 sm:mb-5">
          도착 순서에 맞춰 경유지 장소, GPS 위치 태그 및 현장 사진을 등록하세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4.5">
          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">카테고리 & 아이콘</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {categoryPresets.map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => handleCategorySelect(preset)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 sm:py-2 px-1 min-h-[44px] rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 touch-manipulation ${
                    category === preset.type
                      ? 'bg-orange-50 border-orange-500 text-orange-900 ring-2 ring-orange-500/20 shadow-sm'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-base">{preset.emoji}</span>
                  <span className="text-[11px]">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Place Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              장소명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="input-stop-name"
              required
              placeholder="예: 코코네 카페, 안산 단원미술관..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 font-medium"
            />
          </div>

          {/* Subtitle / summary */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">한 줄 소개</label>
            <input
              type="text"
              id="input-stop-subtitle"
              placeholder="예: 핸드드립 스페셜티와 구움과자 전문점"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">도착 예정 시간</label>
              <input
                type="text"
                id="input-stop-time"
                placeholder="예: 03:00 PM"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">체류 시간</label>
              <input
                type="text"
                id="input-stop-duration"
                placeholder="예: 1시간 30분"
                value={stayDuration}
                onChange={(e) => setStayDuration(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Transit Method from Previous Stop */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-orange-600" />
                <span>이전 경유지에서의 이동방법</span>
              </label>
              <span className="text-[10px] text-orange-700 font-semibold">순서 연동</span>
            </div>

            {/* Transit buttons */}
            <div className="grid grid-cols-5 gap-1">
              {[
                { type: 'walk' as TransitType, label: '도보', icon: Footprints, defaultText: '도보 7분 (450m)' },
                { type: 'car' as TransitType, label: '자가용', icon: Car, defaultText: '차량 10분 (2.8km)' },
                { type: 'bus' as TransitType, label: '버스', icon: Bus, defaultText: '버스 12분 (3정거장)' },
                { type: 'subway' as TransitType, label: '지하철', icon: Train, defaultText: '지하철 15분' },
                { type: 'bike' as TransitType, label: '자전거', icon: Bike, defaultText: '자전거 8분 (1.5km)' },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = transitType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => {
                      setTransitType(t.type);
                      setDistanceFromPrev(t.defaultText);
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

            <div>
              <input
                type="text"
                id="input-stop-transit-distance"
                placeholder="예: 도보 7분 (450m) 또는 차량 12분 (3.5km)"
                value={distanceFromPrev}
                onChange={(e) => setDistanceFromPrev(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Address with integrated GPS helper */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700">도로명 주소</label>
              {gpsLocation && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  GPS 위치 연동됨
                </span>
              )}
            </div>
            <input
              type="text"
              id="input-stop-address"
              placeholder="예: 경기 안산시 단원구 중앙대로 100"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
            />
          </div>

          {/* ========================================================================= */}
          {/* PHOTO REGISTRATION SECTION WITH GPS & CAMERA CAPTURE */}
          {/* ========================================================================= */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-orange-600" />
                <span>경유지 사진 등록 &amp; GPS 위치</span>
              </label>
              <span className="text-[11px] font-semibold text-stone-500">
                카메라 · GPS · 파일 · URL
              </span>
            </div>

            {/* Quick Action Buttons Toolbar: Camera, GPS, Upload */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* 1. Live Camera Photo Capture Button */}
              <button
                type="button"
                id="btn-open-camera"
                onClick={() => startCamera()}
                className="flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 touch-manipulation"
              >
                <Camera className="w-4 h-4" />
                <span>사진 촬영</span>
              </button>

              {/* 2. GPS Location Fetch Button */}
              <button
                type="button"
                id="btn-get-gps"
                onClick={handleGetGpsLocation}
                disabled={isGpsLoading}
                className={`flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                  gpsLocation
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30'
                    : 'bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-800 border-stone-200 shadow-sm'
                }`}
              >
                {isGpsLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
                    <span>위치 탐색중...</span>
                  </>
                ) : gpsLocation ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>GPS 갱신</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4 text-orange-600" />
                    <span>GPS 위치 조회</span>
                  </>
                )}
              </button>

              {/* 3. File Upload Button */}
              <label className="flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-200 shadow-sm transition-all cursor-pointer col-span-2 sm:col-span-1 active:scale-95 touch-manipulation">
                <Upload className="w-4 h-4 text-stone-600" />
                <span>파일 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>

              {/* Hidden native camera capture input for mobile devices */}
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFileUpload}
                className="hidden"
              />
            </div>

            {/* GPS Status Card if fetched or error */}
            {gpsLocation && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900">
                <div className="flex items-center gap-2 min-w-0">
                  <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold">현재 GPS: </span>
                    <span className="font-mono">{gpsLocation.formattedText}</span>
                    {gpsLocation.accuracy && (
                      <span className="text-[10px] text-emerald-700 ml-1 opacity-80">
                        (오차 ±{gpsLocation.accuracy}m)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGpsLocation(null)}
                  className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors"
                  title="GPS 삭제"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* GPS Error & Fallback */}
            {gpsError && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-2">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p>{gpsError}</p>
                    <button
                      type="button"
                      onClick={handleUseDemoGps}
                      className="mt-1 text-[11px] font-bold text-amber-800 underline hover:text-amber-900 cursor-pointer"
                    >
                      테스트용 안산 단원구 GPS 좌표 자동 입력하기
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGpsError(null)}
                  className="text-amber-600 hover:text-amber-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Live Camera Viewfinder Overlay when Camera is open */}
            {isCameraOpen && (
              <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-orange-500 shadow-xl p-2 flex flex-col items-center">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-900 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Viewfinder crosshairs */}
                  <div className="absolute inset-4 border border-white/30 rounded-lg pointer-events-none flex items-center justify-center">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-orange-400 absolute top-0 left-0"></div>
                    <div className="w-6 h-6 border-t-2 border-r-2 border-orange-400 absolute top-0 right-0"></div>
                    <div className="w-6 h-6 border-b-2 border-l-2 border-orange-400 absolute bottom-0 left-0"></div>
                    <div className="w-6 h-6 border-b-2 border-r-2 border-orange-400 absolute bottom-0 right-0"></div>
                    <Crosshair className="w-6 h-6 text-white/40" />
                  </div>

                  {/* Top camera controls */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      실시간 카메라
                    </span>

                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                      title="전면/후면 카메라 전환"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Shutter & Cancel bar */}
                <div className="w-full flex items-center justify-between px-3 pt-2.5">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="text-xs font-bold text-stone-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    카메라 닫기
                  </button>

                  {/* Big shutter button */}
                  <button
                    type="button"
                    id="btn-shutter-capture"
                    onClick={handleCapturePhoto}
                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-stone-100 text-stone-900 text-xs font-black shadow-lg ring-4 ring-orange-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></div>
                    <span>찰칵! 사진 촬영</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="text-[11px] font-semibold text-stone-400 hover:text-stone-200"
                    title="기기 기본 카메라 앱 열기"
                  >
                    기본앱 열기
                  </button>
                </div>

                {cameraError && (
                  <p className="text-[11px] text-rose-400 mt-2 text-center">{cameraError}</p>
                )}
              </div>
            )}

            {/* URL Input */}
            <div className="flex gap-2">
              <input
                type="url"
                id="input-photo-url"
                placeholder="또는 웹 이미지 URL (https://...)"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="flex-1 px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
              />
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold"
                  title="사진 지우기"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Photo preview with GPS Tag Overlay */}
            {photoUrl && (
              <div className="relative h-36 rounded-xl overflow-hidden border border-stone-200 bg-stone-900 shadow-inner group">
                <img
                  src={photoUrl}
                  alt="등록할 사진 미리보기"
                  className="w-full h-full object-cover"
                />

                {/* GPS Location badge on photo preview */}
                {gpsLocation && (
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-emerald-400" />
                    <span>GPS: {gpsLocation.formattedText}</span>
                  </div>
                )}

                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <span className="text-[10px] bg-black/70 backdrop-blur-md text-white px-2 py-0.5 rounded-full font-medium">
                    등록 완료 미리보기
                  </span>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="text-[10px] bg-orange-600 hover:bg-orange-700 text-white px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer"
                  >
                    다시 촬영
                  </button>
                </div>
              </div>
            )}

            {/* Photo Caption */}
            <input
              type="text"
              id="input-photo-caption"
              placeholder="사진 설명 (예: 직접 촬영한 매장 전경 및 시그니처 메뉴)"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">상세 설명</label>
            <textarea
              id="input-stop-desc"
              rows={2}
              placeholder="장소에 대한 소개나 추천 이유를 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              id="btn-cancel-add-modal"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer active:scale-95 touch-manipulation text-center"
            >
              취소
            </button>
            <button
              type="submit"
              id="btn-submit-add-stop"
              className="flex-2 sm:flex-initial px-6 py-2.5 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-black shadow-lg shadow-orange-600/25 transition-all cursor-pointer active:scale-95 touch-manipulation text-center"
            >
              경유지 등록 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

