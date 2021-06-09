import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';

import { IndexedDBService } from './services/indexedDB/indexed-db.service';
import { AuthService } from './services/authservice/auth-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  opened: false;
  title = 'client';

  constructor(public translate: TranslateService, private db: IndexedDBService, private authService: AuthService) {
    translate.setDefaultLang('de');
    translate.use(localStorage.getItem('PLONK_lang'));
  }

  lang(lang) {
    localStorage.setItem('PLONK_lang', lang);
    this.translate.use(lang);
  }

  logout() {
    this.authService.logout();
  }
}
