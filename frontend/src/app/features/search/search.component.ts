import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlacesService } from '../../core/services/places.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { PlaceCardComponent } from '../../shared/components/place-card/place-card.component';
import { Place } from '../../core/models/place.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    PlaceCardComponent,
    TranslateModule,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  public query = '';
  public city = '';
  public radius = 5000;
  public results: Place[] = [];
  public loading = false;
  public locationLoading = false;
  public searched = false;

  private currentLat: number | null = null;
  private currentLng: number | null = null;

  public readonly radiusOptions = [
    { value: 1000, label: '1 км' },
    { value: 2000, label: '2 км' },
    { value: 5000, label: '5 км' },
    { value: 10000, label: '10 км' },
    { value: 20000, label: '20 км' },
  ];

  constructor(
    private readonly placesService: PlacesService,
    public readonly wishlistService: WishlistService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
  ) {}

  /** Request user's geolocation from browser */
  public useMyLocation(): void {
    this.locationLoading = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.currentLat = pos.coords.latitude;
        this.currentLng = pos.coords.longitude;
        this.city = 'Моя геолокація';
        this.locationLoading = false;
        this.snackBar.open('Геолокацію визначено!', '✓', { duration: 2000 });
      },
      () => {
        this.locationLoading = false;
        this.snackBar.open('Не вдалось визначити геолокацію', '✕', {
          duration: 3000,
        });
      },
    );
  }

  /* Trigger search using coordinates or city name */
  public search(): void {
    if (!this.query.trim()) {
      this.snackBar.open('Введіть ключове слово', '✕', { duration: 2000 });
      return;
    }

    if (this.currentLat && this.currentLng) {
      this.doSearch(this.currentLat, this.currentLng);
    } else if (this.city.trim()) {
      this.loading = true;
      this.placesService.geocodeCity(this.city).subscribe({
        next: (res) => this.doSearch(res.lat, res.lng),
        error: () => {
          this.loading = false;
          this.snackBar.open('Місто не знайдено', '✕', { duration: 3000 });
        },
      });
    } else {
      this.snackBar.open('Введіть місто або використайте геолокацію', '✕', {
        duration: 3000,
      });
    }
  }

  /* Execute the actual API search request */
  private doSearch(lat: number, lng: number): void {
    this.loading = true;
    this.placesService
      .searchPlaces(this.query, lat, lng, this.radius)
      .subscribe({
        next: (res) => {
          this.results = res.results;
          this.searched = true;
          this.loading = false;
          if (res.source === 'cache') {
            this.snackBar.open('Результати з кешу', '📦', { duration: 2000 });
          }
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Помилка пошуку', '✕', { duration: 3000 });
        },
      });
  }

  /* Add or remove a place from wishlist */
  public toggleWishlist(place: Place): void {
    if (this.wishlistService.isInWishlist(place.place_id)) {
      this.wishlistService.removeFromWishlist(place.place_id).subscribe({
        next: () =>
          this.snackBar.open('Видалено з wishlist', '✓', { duration: 2000 }),
        error: () => this.snackBar.open('Помилка', '✕', { duration: 2000 }),
      });
    } else {
      this.wishlistService.addToWishlist(place).subscribe({
        next: () =>
          this.snackBar.open('Додано до wishlist!', '✓', { duration: 2000 }),
        error: () => this.snackBar.open('Помилка', '✕', { duration: 2000 }),
      });
    }
  }

  /* Navigate to place detail page */
  public openDetail(place: Place): void {
    this.router.navigate(['/place', place.place_id]);
  }
}
