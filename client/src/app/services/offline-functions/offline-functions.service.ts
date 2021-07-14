import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class OfflineFunctionsService {

  node_url = environment.apiServer;
  
  constructor() { }

  async isOnline(){
    try {
      const online = await fetch("/assets/i18n/null.json", {
        cache: 'no-cache'
      });
      return online.status >= 200 && online.status < 300; // either true or false
    } catch (err) {
      return false; // definitely offline
    }
  }
}
