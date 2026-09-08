export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  formattedText?: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  author?: string;
  tag?: string;
  gps?: GPSLocation;
}

export type CategoryType = 'cafe' | 'convenience' | 'bakery' | 'restaurant' | 'attraction' | 'nature' | 'shopping' | 'etc';

export type TransitType = 'walk' | 'car' | 'bus' | 'subway' | 'bike';

export interface Waypoint {
  id: string;
  order: number; // 1, 2, 3, 4 ...
  name: string;
  subtitle: string;
  category: CategoryType;
  iconName: 'Coffee' | 'Store' | 'Donut' | 'Flame' | 'MapPin' | 'Camera' | 'Trees' | 'Utensils';
  iconEmoji: string;
  coordinates: {
    x: number; // 0 to 100 percentage
    y: number; // 0 to 100 percentage
  };
  gpsLocation?: GPSLocation;
  arrivalTime: string;
  stayDuration: string;
  distanceFromPrev: string;
  transitType?: TransitType;
  address: string;
  description: string;
  specialtyMenu?: string[];
  tips?: string;
  rating: number;
  reviewCount: number;
  photos: PhotoItem[];
}

export interface TravelCourse {
  id: string;
  title: string;
  theme?: string; // 코스 여행 주제 (예: 도심 힐링, 맛집 투어, 빵지순례, 바다 드라이브 등)
  description: string;
  region: string;
  totalDistance: string;
  estimatedDuration: string;
  waypoints: Waypoint[];
}
