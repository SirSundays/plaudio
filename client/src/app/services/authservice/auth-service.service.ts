import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from "@auth0/angular-jwt";
import * as moment from "moment";
import { KJUR } from "jsrsasign";
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  api = "http://localhost:5000/api/pre";
  helper = new JwtHelperService();

  pubkey = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3fO6RlgQWI6UulbWs4h1
fO61yUJnaRKW1yBJIm51l7l/wmmQjzcCoc/GXnnBSpEWXBbK4yqYXRh748D6iyBc
SPvsN8Ks5mJbxnepAmckFNbKHAcob8pXAEgXcMoKYqIjl4Mwu9Y57NtQmEuyiVmD
O5W+IwiDoagzewWabEPITJl/DKD2EmvEDurbTqGkNmrVy8bEiYjA33TZ8uBbRIW6
H9Qt6oo1vPsuF+75vNQcsjCnfdTld7X3K8S0EkXhFNvleU2ZsFJX0mncX7Z2QfgK
SKk3r7Sr09OG6BI84G66wnmnuvSYmEVn51qXeG9dc7pjws1pUShY+930nA0/Ktkp
+wIDAQAB
-----END PUBLIC KEY-----
  `

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
    if (!this.helper.isTokenExpired(this.getToken()) && this.verifyToken()) {
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
    let jwt = this.getToken();
    return KJUR.jws.JWS.verifyJWT(jwt, this.pubkey, {alg: ['RS256']});
  }

  getToken() {
    return localStorage.getItem("id_token");
  }
}
