import { TravelCourse } from '../types';

export const INITIAL_COURSES: TravelCourse[] = [
  {
    id: 'danwon-food-tour',
    title: '단원구 도심 힐링 & 맛집 코스',
    theme: '☕ 감성 카페 & 로컬 맛집',
    description: '향긋한 핸드드립 커피부터 갓 구운 베이글, 저녁 곱창구이까지 이어지는 완벽한 1일 투어',
    region: '경기 안산시 단원구',
    totalDistance: '3.8 km',
    estimatedDuration: '약 5시간 30분',
    waypoints: [
      {
        id: 'stop-1',
        order: 1,
        name: '코코네 카페',
        subtitle: '스페셜티 드립커피 & 바닐라빈 라떼',
        category: 'cafe',
        iconName: 'Coffee',
        iconEmoji: '☕',
        coordinates: { x: 20, y: 22 },
        arrivalTime: '11:00 AM',
        stayDuration: '1시간 20분',
        distanceFromPrev: '출발 지점',
        transitType: 'walk',
        address: '경기 안산시 단원구 예술대학로 42',
        description: '따뜻한 우드톤 인테리어와 핸드드립 스페셜티 커피의 깊은 향이 머무는 감성 카페입니다. 시그니처 바닐라빈 라떼와 겉바속촉 에그타르트가 인기입니다.',
        specialtyMenu: ['코코 시그니처 라떼 (6,000원)', '에티오피아 핸드드립 (6,500원)', '수제 에그타르트 (3,800원)'],
        tips: '창가 원목 테이블 자리는 오후 채광이 좋아 사진이 아주 잘 나옵니다.',
        rating: 4.85,
        reviewCount: 312,
        photos: [
          {
            id: 'cafe-1',
            url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
            caption: '아늑한 분위기의 코코네 카페 원목 바 카운터와 실내 전경',
            tag: '실내 공간'
          },
          {
            id: 'cafe-2',
            url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
            caption: '스페셜티 원두로 정성스레 내린 시그니처 플랫화이트 & 라떼아트',
            tag: '시그니처 메뉴'
          },
          {
            id: 'cafe-3',
            url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
            caption: '햇살이 비치는 창가 테이블과 따뜻한 드립 커피 한 잔',
            tag: '감성 포토존'
          },
          {
            id: 'cafe-4',
            url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
            caption: '매일 아침 직접 구워내는 따끈한 수제 구움과자와 타르트',
            tag: '디저트'
          }
        ]
      },
      {
        id: 'stop-2',
        order: 2,
        name: 'GS25 안산고잔점',
        subtitle: '여행 필수 간식 & 음료 충전소',
        category: 'convenience',
        iconName: 'Store',
        iconEmoji: '🏪',
        coordinates: { x: 28, y: 64 },
        arrivalTime: '12:40 PM',
        stayDuration: '20분',
        distanceFromPrev: '도보 6분 (380m)',
        transitType: 'walk',
        address: '경기 안산시 단원구 광덕대로 154',
        description: '다음 경유지로 향하기 전 음료와 산책용 간식, 비상용품을 편리하게 구입할 수 있는 24시간 편의점입니다. 쾌적한 야외 파라솔 테라스가 마련되어 있습니다.',
        specialtyMenu: ['얼음컵 & 유자 에이드 (2,000원)', '즉석 뽀글이 라면 (3,500원)', '프리미엄 삼각김밥 (1,500원)'],
        tips: '야외 테라스 파라솔 좌석에서 시원한 캔음료를 마시며 잠시 쉬어가기 좋습니다.',
        rating: 4.6,
        reviewCount: 94,
        photos: [
          {
            id: 'gs25-1',
            url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
            caption: '다양한 음료와 신선 간식이 정갈하게 진열된 매장',
            tag: '매장 전경'
          },
          {
            id: 'gs25-2',
            url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80',
            caption: '이동 중 시원하게 즐기는 테이크아웃 캔음료와 보틀 드링크',
            tag: '인기 음료'
          },
          {
            id: 'gs25-3',
            url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
            caption: '간편하게 즐길 수 있는 출출할 때 최고의 즉석 컵면과 스낵',
            tag: '스낵류'
          }
        ]
      },
      {
        id: 'stop-3',
        order: 3,
        name: '베이글 코코',
        subtitle: '매일 굽는 참나무 화덕 수제 베이글',
        category: 'bakery',
        iconName: 'Donut',
        iconEmoji: '🥯',
        coordinates: { x: 62, y: 35 },
        arrivalTime: '02:00 PM',
        stayDuration: '1시간 10분',
        distanceFromPrev: '차량 8분 또는 버스 12분 (1.8km)',
        transitType: 'car',
        address: '경기 안산시 단원구 중앙대로 833',
        description: '참나무 화덕에서 매일 정성껏 구워내는 쫄깃하고 담백한 수제 베이글 전문점입니다. 쪽파 크림치즈와 무화과 월넛 크림치즈를 듬뿍 바른 샌드위치가 시그니처입니다.',
        specialtyMenu: ['쪽파 베이컨 크림치즈 베이글 (5,800원)', '잠봉뵈르 소금빵 베이글 (7,500원)', '트러플 머쉬룸 수프 (6,200원)'],
        tips: '오후 2시 전후로 갓 구운 베이글이 나와 가장 따끈하고 바삭합니다.',
        rating: 4.91,
        reviewCount: 528,
        photos: [
          {
            id: 'bagel-1',
            url: 'https://images.unsplash.com/photo-1585478259715-876a6a81ae08?auto=format&fit=crop&w=1200&q=80',
            caption: '노릇노릇 바삭하게 갓 구워져 나온 수제 깨 베이글과 플레인 베이글',
            tag: '대표 베이글'
          },
          {
            id: 'bagel-2',
            url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
            caption: '신선한 재료와 홈메이드 크림치즈를 아낌없이 채운 시그니처 샌드위치',
            tag: '베이글 샌드위치'
          },
          {
            id: 'bagel-3',
            url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
            caption: '유럽 감성이 물씬 풍기는 베이글 코코의 아늑한 베이커리 매대',
            tag: '매장 분위기'
          }
        ]
      },
      {
        id: 'stop-4',
        order: 4,
        name: '단원구 곱창',
        subtitle: '지글지글 불맛 가득 한우 소곱창 모듬구이',
        category: 'restaurant',
        iconName: 'Flame',
        iconEmoji: '🔥',
        coordinates: { x: 78, y: 22 },
        arrivalTime: '05:30 PM',
        stayDuration: '1시간 40분',
        distanceFromPrev: '도보 10분 (650m)',
        transitType: 'walk',
        address: '경기 안산시 단원구 고잔동 720-3',
        description: '하루를 든든하게 마무리하는 고소하고 쫄깃한 한우 소곱창 전문점입니다. 돌판 위에서 파김치, 부추와 함께 지글지글 구워 먹는 모듬구이와 날치알 볶음밥이 일품입니다.',
        specialtyMenu: ['한우 모듬 곱창구이 2인 (48,000원)', '얼큰 곱창전골 (32,000원)', '치즈 날치알 볶음밥 (4,000원)'],
        tips: '기본 찬으로 나오는 대파김치와 콩나물국을 불판에 같이 구워 먹으면 감칠맛이 배가됩니다.',
        rating: 4.88,
        reviewCount: 680,
        photos: [
          {
            id: 'gopchang-1',
            url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
            caption: '달궈진 무쇠 돌판 위에서 노릇하게 구워지는 고소한 모듬 곱창과 대창',
            tag: '대표 구이'
          },
          {
            id: 'gopchang-2',
            url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
            caption: '활기 넘치고 정겨운 저녁 맛집 테이블과 푸짐한 상차림',
            tag: '매장 상차림'
          },
          {
            id: 'gopchang-3',
            url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80',
            caption: '고소한 곱창 기름에 바삭하게 눌러 붙인 필수 코스 치즈 볶음밥',
            tag: 'K-디저트 볶음밥'
          }
        ]
      }
    ]
  },
  {
    id: 'jeju-east-coast',
    title: '제주 동쪽 감성 바다 & 오름 코스',
    theme: '🏖️ 에메랄드빛 바다 드라이브',
    description: '에메랄드빛 해변 산책부터 오션뷰 베이글, 푸른 동산과 일출봉까지 둘러보는 대표 코스',
    region: '제주특별자치도 제주시 & 서귀포시',
    totalDistance: '24.5 km',
    estimatedDuration: '약 7시간',
    waypoints: [
      {
        id: 'jeju-1',
        order: 1,
        name: '함덕 해수욕장',
        subtitle: '에메랄드빛 바다와 서우봉 둘레길',
        category: 'nature',
        iconName: 'MapPin',
        iconEmoji: '🏖️',
        coordinates: { x: 18, y: 30 },
        arrivalTime: '10:00 AM',
        stayDuration: '1시간 30분',
        distanceFromPrev: '출발 지점',
        transitType: 'walk',
        address: '제주 제주시 조천읍 조함해안로 525',
        description: '야자수와 백사장, 에메랄드빛 바다가 어우러진 제주의 대표 해변입니다. 서우봉 산책로에 오르면 바다 전체를 조망할 수 있습니다.',
        specialtyMenu: ['해변 카페 한라봉 스무디', '현지 해녀 김밥'],
        tips: '밀물 때보다 썰물 때 바다색이 훨씬 투명하고 걷기 좋습니다.',
        rating: 4.92,
        reviewCount: 1420,
        photos: [
          {
            id: 'jeju-p1',
            url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
            caption: '맑고 투명한 함덕 해변의 물빛과 고운 백사장',
            tag: '해변 뷰'
          },
          {
            id: 'jeju-p2',
            url: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80',
            caption: '서우봉으로 이어지는 푸른 산책로와 파도 풍경',
            tag: '산책 코스'
          }
        ]
      },
      {
        id: 'jeju-2',
        order: 2,
        name: '동복리 오션베이글',
        subtitle: '바다를 마주보며 즐기는 시그니처 브런치',
        category: 'bakery',
        iconName: 'Donut',
        iconEmoji: '🥯',
        coordinates: { x: 38, y: 48 },
        arrivalTime: '12:00 PM',
        stayDuration: '1시간 10분',
        distanceFromPrev: '차량 12분 (7.2km)',
        transitType: 'car',
        address: '제주 제주시 구좌읍 동복로 85',
        description: '탁 트인 동쪽 바다를 유리창 너머로 감상하며 갓 구운 감자치즈 베이글과 수제 스프를 즐기는 핫플레이스입니다.',
        specialtyMenu: ['포테이토 치즈 베이글 (5,500원)', '토마토 바질 수프 (7,000원)'],
        tips: '바다 전망 통유리 창가석은 회전율이 빨라 10분 정도 대기하면 착석 가능합니다.',
        rating: 4.88,
        reviewCount: 890,
        photos: [
          {
            id: 'jeju-p3',
            url: 'https://images.unsplash.com/photo-1585478259715-876a6a81ae08?auto=format&fit=crop&w=1200&q=80',
            caption: '창밖 바다와 함께 즐기는 따뜻한 수제 베이글 브런치 플레이트',
            tag: '오션뷰 브런치'
          },
          {
            id: 'jeju-p4',
            url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
            caption: '바다 바람이 느껴지는 제주 돌담 테라스 좌석',
            tag: '돌담 테라스'
          }
        ]
      },
      {
        id: 'jeju-3',
        order: 3,
        name: '비자림 힐링숲',
        subtitle: '천년의 비자나무 숲길 산책',
        category: 'nature',
        iconName: 'Trees',
        iconEmoji: '🌲',
        coordinates: { x: 60, y: 35 },
        arrivalTime: '02:00 PM',
        stayDuration: '1시간 40분',
        distanceFromPrev: '차량 15분 (9.5km)',
        transitType: 'car',
        address: '제주 제주시 구좌읍 비자숲길 55',
        description: '500~800년 수령의 거대한 비자나무 수천 그루가 군락을 이루는 피톤치드 가득한 원시림 산책로입니다.',
        specialtyMenu: ['비자나무 숲길 피톤치드 코스', '새천년 비자나무 포토존'],
        tips: '화산송이 흙길로 조성되어 편안한 운동화를 착용하시는 것을 추천합니다.',
        rating: 4.95,
        reviewCount: 2310,
        photos: [
          {
            id: 'jeju-p5',
            url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
            caption: '신비로운 초록빛 이끼와 거목들이 울창한 비자림 산책길',
            tag: '숲길 전경'
          },
          {
            id: 'jeju-p6',
            url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
            caption: '나뭇잎 사이로 쏟아지는 햇살과 맑은 공기',
            tag: '피톤치드 힐링'
          }
        ]
      },
      {
        id: 'jeju-4',
        order: 4,
        name: '성산일출봉',
        subtitle: '유네스코 세계자연유산 해넘이',
        category: 'attraction',
        iconName: 'Camera',
        iconEmoji: '🌅',
        coordinates: { x: 82, y: 60 },
        arrivalTime: '04:40 PM',
        stayDuration: '2시간',
        distanceFromPrev: '차량 20분 (12km)',
        transitType: 'car',
        address: '제주 서귀포시 성산읍 일출로 284-12',
        description: '푸른 바다 위 우뚝 솟은 거대한 화산 분화구로, 정상에서 내려다보는 성산포와 제주 바다의 일몰은 평생 잊지 못할 장관입니다.',
        specialtyMenu: ['성산포 우뭇가사리 젤리', '제주 흑돼지 해물라면'],
        tips: '무료 관람 코스인 해안 산책로에서도 분화구 전경을 멋지게 감상할 수 있습니다.',
        rating: 4.97,
        reviewCount: 3840,
        photos: [
          {
            id: 'jeju-p7',
            url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
            caption: '웅장한 성산일출봉 정상 능선과 푸른 에메랄드빛 제주 바다',
            tag: '자연 경관'
          },
          {
            id: 'jeju-p8',
            url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            caption: '저녁 노을빛으로 물드는 성산포구 해안선',
            tag: '일몰 파노라마'
          }
        ]
      }
    ]
  }
];
