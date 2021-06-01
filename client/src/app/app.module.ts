import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { NgxFlagsModule } from 'ngx-flags';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

//Directives
import { GridColsDirective } from './directives/grid-cols/grid-cols.directive';


//Paginator
import { getGermanPaginatorIntl } from './german-paginator-intl';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { environment } from '../environments/environment';


//Audio Upload
import { AudioUploadComponent } from './components/audio-upload/audio-upload.component';
import { ServiceWorkerModule } from '@angular/service-worker';

/**
 * Diese Funktion initialisiert Keycloak
 * Es müssen die jeweiligen Parameter zur Verbindung mit dem Keycloak Server angegeben werden.
 * Alle Dateien im Assets Ordner werden nicht von Keycloak geschützt.
 * Hier wird auch die 'silent-check-sso.html' eingebunden.
 * Mehr Infos: https://www.npmjs.com/package/keycloak-angular
 * @param keycloak 
 */
function initializeKeycloak(keycloak: KeycloakService) {
  return () => 
    
    keycloak.init({
      config: {
        url: environment.keycloakURL,
        realm: environment.keycloakRealm,
        clientId: environment.keycloakClient,
      },
      initOptions: {
        checkLoginIframe: false,
      },
      
      enableBearerInterceptor: true,
      bearerExcludedUrls: [
        '/assets'
      ]
    })

}


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    GridColsDirective,
    AudioUploadComponent,
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    AppRoutingModule,
    KeycloakAngularModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'de',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    NgxFlagsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    }, DatePipe,
    {
      provide: MatPaginatorIntl, useValue: getGermanPaginatorIntl()
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }