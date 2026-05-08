import { Routes } from '@angular/router';
import { SearchComponent } from './features/search/search.component';
import { WishlistComponent } from './features/wishlist/wishlist.component';
import { PlaceDetailComponent } from './features/place-detail/place-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },
  { path: 'search', component: SearchComponent },
  { path: 'wishlist', component: WishlistComponent },
  { path: 'place/:id', component: PlaceDetailComponent },
];
