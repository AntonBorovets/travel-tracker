import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Place } from '../../../core/models/place.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-place-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TranslateModule,
  ],
  templateUrl: './place-card.component.html',
  styleUrl: './place-card.component.scss',
})
export class PlaceCardComponent {
  public readonly place = input.required<Place>();
  public readonly inWishlist = input<boolean>(false);
  public readonly wishlistToggle = output<Place>();
  public readonly detailClick = output<Place>();
}
