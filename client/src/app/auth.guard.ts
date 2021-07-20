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
        /// check if Online
        /// could give false true back
        /// description: https://stackoverflow.com/questions/189430/detect-the-internet-connection-is-offline
        let isOnline = window.navigator.onLine 
        /// dont behave like it should behave: gives true when offline
        //let isOnline = await this.offlineFunctions.isOnline()

        const currentUser = await this.authService.isLoggedIn();
        if (currentUser) {
            if(isOnline){
                var verify = false
                await this.authService.verifyToken().then(
                    (result: boolean)=>{
                        verify = result
                    },
                    (error)=>{
                        /// it can happen that the browser isnt connected to the internet
                        /// and still sends a http request (look at isOnline)
                        if(error == 504){
                            verify = true 
                            console.log("Error: Backend Server konnte nicht erreicht werden.")
                        }else{
                            verify = false
                        }
                    }
                )

                if(!verify){
                    this.translater.translationAlert("AUTH.VERIFY-UNAUTHORIZED")
                    this.authService.logout()
                    return false
                }
                
            }else{
                console.log("offline")
            }
            return true;
        }

        // not logged in so redirect to login page with the return url
        this.router.navigate(['/login']);
        return false;
    }
}