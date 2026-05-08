import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { WishlistService } from '../../../core/services/wishlist.service';
import { LanguageService } from '../../../core/services/language.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatSelectModule,
    FormsModule,
    TranslateModule,
    ButtonComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  public currentLang = 'uk';
  public readonly langs = ['uk', 'en'];

  constructor(
    public readonly wishlistService: WishlistService,
    private readonly languageService: LanguageService,
  ) {}

  public ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLang();
  }

  /** Switch app language */
  public onLangChange(lang: string): void {
    this.currentLang = lang;
    this.languageService.switchLang(lang);
  }
}
