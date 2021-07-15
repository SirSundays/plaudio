import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthService } from './services/authservice/auth-service.service';

import { OfflineFunctionsService } from './services/offline-functions/offline-functions.service';

import { TranslaterService } from './services/translater/translater.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private authService: AuthService,
        protected readonly offlineFunctions: OfflineFunctionsService,
        public translater: TranslaterService
    ) { }

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        
        let isOnline = await this.offlineFunctions.isOnline()
        if(isOnline){
            let verify = await this.authService.verifyToken()
            if(!verify){
                this.translater.translationAlert("VERIFY-UNAUTHORIZED")
                this.authService.logout()
                return false
            }
        }else{
            console.log("offline")
        }
        
        const currentUser = this.authService.isLoggedIn();
        if (currentUser) {
            return true;
        }

        // not logged in so redirect to login page with the return url
        this.router.navigate(['/login']);
        return false;
    }
}