import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../environments/environment';

import { IndexedDBService } from './services/indexedDB/indexed-db.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  opened: false;
  title = 'client';
  // Lädt die User Profil URL aus der environment-Datei
  userProfileURL = environment.userProfileURL;

  constructor(private keycloakService: KeycloakService, public translate: TranslateService, private db: IndexedDBService) {
    translate.setDefaultLang('de');
    translate.use(localStorage.getItem('PLONK_lang'));
  }

  // Keycloak Logout Funktion
  async doLogout() {
    localStorage.removeItem("token");
    await this.db.deleteDB()
    await this.keycloakService.logout();
  }

  lang(lang) {
    localStorage.setItem('PLONK_lang', lang);
    this.translate.use(lang);
  }
}
