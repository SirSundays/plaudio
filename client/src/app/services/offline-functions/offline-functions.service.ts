import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OfflineFunctionsService {

  api = environment.apiServer + "/api/pre";

  node_url = environment.apiServer;
  
  constructor(private http: HttpClient) { }

  async isOnline(){ // wont function, maybe because of cache??
    try {
      const online = await fetch("/assets/i18n/null.json", {
        cache: "reload"
      });
      console.log("online.status")
      console.log(online.status)
      alert(online.status)
      return online.status >= 200 && online.status < 300; // either true or false
    } catch (err) {
      return false; // definitely offline
    }
  }
}
