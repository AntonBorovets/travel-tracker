export interface Place {
  place_id: string;
  name: string;
  category: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  distance: number | null;
  city: string;
  country: string;
  website: string | null;
  phone: string | null;
  opening_hours: string | null;
  rating: number | null;
  photo_url: string | null;
}

export interface SearchResponse {
  source: string;
  results: Place[];
}

export interface GeocodeResponse {
  source: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface WishlistItem {
  fsq_id: string;
  name: string;
  category: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  rating: number | null;
  created_at: string;
}
