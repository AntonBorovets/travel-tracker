import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LANG_KEY = 'lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly supported = ['uk', 'en'];

  constructor(private readonly translate: TranslateService) {}

  /** Initialize language on app start */
  public init(): void {
    this.translate.addLangs(this.supported);
    this.translate.setDefaultLang('uk');
    const saved = this.getSavedLang();
    this.translate.use(saved);
  }

  /** Switch language and persist to localStorage */
  public switchLang(lang: string): void {
    localStorage.setItem(LANG_KEY, lang);
    this.translate.use(lang);
  }

  /** Get current active language */
  public getCurrentLang(): string {
    return this.translate.currentLang || 'uk';
  }

  /** Get saved language from localStorage or browser */
  private getSavedLang(): string {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && this.supported.includes(saved)) return saved;
    const browser = navigator.language?.split('-')[0] ?? 'uk';
    return this.supported.includes(browser) ? browser : 'uk';
  }
}
