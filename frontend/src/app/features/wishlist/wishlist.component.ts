import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WishlistService } from '../../core/services/wishlist.service';
import { PlaceCardComponent } from '../../shared/components/place-card/place-card.component';
import { Place, WishlistItem } from '../../core/models/place.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    PlaceCardComponent,
    TranslateModule,
  ],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent implements OnInit {
  public items: WishlistItem[] = [];
  public loading = false;

  constructor(
    private readonly wishlistService: WishlistService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
  ) {}

  /* Load wishlist items on component init */
  public ngOnInit(): void {
    this.loadWishlist();
  }

  /* Fetch all wishlist items from backend */
  public loadWishlist(): void {
    this.loading = true;
    this.wishlistService.getWishlist().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Помилка завантаження wishlist', '✕', {
          duration: 3000,
        });
      },
    });
  }

  /* Remove a single item from wishlist and update local list */
  public removeItem(item: WishlistItem): void {
    this.wishlistService.removeFromWishlist(item.fsq_id).subscribe({
      next: () => {
        this.items = this.items.filter((i) => i.fsq_id !== item.fsq_id);
        this.snackBar.open('Видалено з wishlist', '✓', { duration: 2000 });
      },
      error: () => this.snackBar.open('Помилка', '✕', { duration: 2000 }),
    });
  }

  /* Convert WishlistItem to Place shape for PlaceCardComponent */
  public toPlace(item: WishlistItem): Place {
    return {
      place_id: item.fsq_id,
      name: item.name,
      category: item.category,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      photo_url: item.photo_url,
      rating: item.rating,
      distance: null,
      city: '',
      country: '',
      website: null,
      phone: null,
      opening_hours: null,
    };
  }

  /* Navigate to place detail page */
  public openDetail(place: Place): void {
    this.router.navigate(['/place', place.place_id]);
  }

  /* Navigate to search page */
  public goToSearch(): void {
    this.router.navigate(['/search']);
  }
}
