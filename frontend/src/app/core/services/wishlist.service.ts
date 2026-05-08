import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Place, WishlistItem } from '../models/place.models';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly apiUrl: string = environment.apiUrl;
  public readonly wishlistIds = signal<Set<string>>(new Set());

  constructor(private readonly http: HttpClient) {
    this.loadWishlistIds();
  }

  /* Load saved wishlist IDs from localStorage on init */
  private loadWishlistIds(): void {
    const saved = localStorage.getItem('wishlist_ids');
    if (saved) {
      this.wishlistIds.set(new Set(JSON.parse(saved)));
    }
  }

  /* Persist current wishlist IDs to localStorage */
  private saveWishlistIds(): void {
    localStorage.setItem(
      'wishlist_ids',
      JSON.stringify([...this.wishlistIds()]),
    );
  }

  /* Fetch full wishlist from backend */
  public getWishlist(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(`${this.apiUrl}/wishlist`);
  }

  /* Add a place to wishlist and update local state */
  public addToWishlist(place: Place): Observable<any> {
    const params: any = {
      fsq_id: place.place_id,
      name: place.name,
    };
    if (place.category) params.category = place.category;
    if (place.address) params.address = place.address;
    if (place.lat != null) params.lat = Number(place.lat);
    if (place.lng != null) params.lng = Number(place.lng);

    return this.http.post(`${this.apiUrl}/wishlist`, null, { params }).pipe(
      tap(() => {
        const current = new Set(this.wishlistIds());
        current.add(place.place_id);
        this.wishlistIds.set(current);
        this.saveWishlistIds();
      }),
    );
  }

  /* Remove a place from wishlist and update local state */
  public removeFromWishlist(placeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/wishlist/${placeId}`).pipe(
      tap(() => {
        const current = new Set(this.wishlistIds());
        current.delete(placeId);
        this.wishlistIds.set(current);
        this.saveWishlistIds();
      }),
    );
  }

  /* Check if a place is already in the wishlist */
  public isInWishlist(placeId: string): boolean {
    return this.wishlistIds().has(placeId);
  }
}
