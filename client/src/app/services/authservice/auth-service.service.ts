import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from "@auth0/angular-jwt";
import * as moment from "moment";
import { KJUR } from "jsrsasign";
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  api = environment.apiServer + "/api/pre";
  helper = new JwtHelperService();

  pubkey = environment.pubKey;

  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, password: string) {
    return this.http.post(this.api + '/login', { username, password });
  }

  setSession(authResult) {
    // const expiresAt = moment().add(authResult.expiresIn, 'second');
    localStorage.setItem('id_token', authResult.idToken);
    // localStorage.setItem("expires_at", JSON.stringify(expiresAt.valueOf()));
  }

  logout() {
    localStorage.removeItem("id_token");
    // localStorage.removeItem("expires_at");
    this.router.navigateByUrl('/login');
  }

  public isLoggedIn() {
    if (!this.helper.isTokenExpired(this.getToken())) {
      return true;
    }
    return false;
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }

  getExpiration() {
    const expiresAt = this.helper.getTokenExpirationDate(this.getToken());
    return moment(expiresAt);
  }

  getUserData() {
    return this.helper.decodeToken(this.getToken());
  }

  verifyToken() {
    let token = this.getToken();
    return KJUR.jws.JWS.verifyJWT(token, this.pubkey, {alg: ['RS256']});
  }

  getToken() {
    return localStorage.getItem("id_token");
  }
}
