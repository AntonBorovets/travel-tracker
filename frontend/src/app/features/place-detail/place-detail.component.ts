import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlacesService } from '../../core/services/places.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Place } from '../../core/models/place.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  templateUrl: './place-detail.component.html',
  styleUrl: './place-detail.component.scss',
})
export class PlaceDetailComponent implements OnInit {
  public place: Place | null = null;
  public loading = false;
  public placeId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly placesService: PlacesService,
    public readonly wishlistService: WishlistService,
    private readonly snackBar: MatSnackBar,
  ) {}

  /* Extract place ID from route and load details */
  public ngOnInit(): void {
    this.placeId = this.route.snapshot.paramMap.get('id') || '';
    if (this.placeId) {
      this.loadDetails();
    }
  }

  /* Fetch place details from backend */
  public loadDetails(): void {
    this.loading = true;
    this.placesService.getPlaceDetails(this.placeId).subscribe({
      next: (data) => {
        this.place = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Помилка завантаження деталей', '✕', {
          duration: 3000,
        });
      },
    });
  }

  /* Add or remove current place from wishlist */
  public toggleWishlist(): void {
    if (!this.place) return;

    if (this.wishlistService.isInWishlist(this.placeId)) {
      this.wishlistService.removeFromWishlist(this.placeId).subscribe({
        next: () =>
          this.snackBar.open('Видалено з wishlist', '✓', { duration: 2000 }),
        error: () => this.snackBar.open('Помилка', '✕', { duration: 2000 }),
      });
    } else {
      this.wishlistService
        .addToWishlist({
          place_id: this.place.place_id || this.placeId,
          name: this.place.name,
          category: this.place.category,
          address: this.place.address,
          lat: this.place.lat,
          lng: this.place.lng,
          photo_url: this.place.photo_url,
          rating: this.place.rating,
          distance: null,
          city: this.place.city || '',
          country: this.place.country || '',
          website: this.place.website,
          phone: this.place.phone,
          opening_hours: this.place.opening_hours,
        })
        .subscribe({
          next: () =>
            this.snackBar.open('Додано до wishlist!', '✓', { duration: 2000 }),
          error: () => this.snackBar.open('Помилка', '✕', { duration: 2000 }),
        });
    }
  }

  /* Navigate back to search page */
  public goBack(): void {
    this.router.navigate(['/search']);
  }
}
