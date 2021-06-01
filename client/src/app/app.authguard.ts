import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

// for the offline Function
import jwtdecode from 'jwt-decode'
import { OfflineFunctionsService } from './services/offline-functions/offline-functions.service';
import { HttpHeaders } from '@angular/common/http';

/*
Dieser AuthGuard ist ein spezieller AuthGuard für Keycloak. Er ist so so konfiguriert, dass Routen nur für manche Rollen zugänglich sind.
Er ist 1:1 aus der Dokumentation für keycloak-angular (https://www.npmjs.com/package/keycloak-angular) übernommen.
Kann erweitert werden.
*/
@Injectable({
    providedIn: 'root',
})
export class AuthGuard extends KeycloakAuthGuard {
    constructor(
        protected readonly router: Router,
        protected readonly keycloak: KeycloakService,
        protected readonly offlineFunctions: OfflineFunctionsService
    ) {
        super(router, keycloak);
    }

    public async isAccessAllowed(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {   
        
        // Get the roles required from the route.
        const requiredRoles = route.data.roles;
        
        // Allow the user to to proceed if no additional roles are required to access the route.
        if (!(requiredRoles instanceof Array) || requiredRoles.length === 0) {
            return true;
        }
        
        var answer = false

        await this.offlineFunctions.isOnline().subscribe( async (isOnline)=>{
            
            if(isOnline){
                if (!this.authenticated) {
                    alert("angemeldet?")
                    await this.keycloak.login({
                        scope: 'openid offline_access',
                    })
                }
                alert("angemeldet!")
                this.keycloak.getToken().then((token)=>{
                    alert(token)
                    localStorage.setItem("token", token);
                });
                alert("check if expired!")
                let isExipred = this.keycloak.isTokenExpired()
                if(isExipred){
                    this.keycloak.updateToken()
                }
                
                // Allow the user to proceed if all the required roles are present.
                answer = requiredRoles.every((role) => this.roles.includes(role));

            }else{
                // Get the Token from the localStorage and decode it
                let token = localStorage.getItem("token")
                
                if(token != null && token != undefined && token != "" && typeof token == "string"){
                    // decode the Token
                    let decoded_token = jwtdecode(token)
                    let decoded_token_header: HttpHeaders = jwtdecode(token, {header:true})

                    // set header 
                    this.keycloak.addTokenToHeader(decoded_token_header)

                    // Get the roles from the Token
                    var rolesFromLocalStorage = decoded_token['realm_access']['roles']
                    // return false, when the user has no roles.
                    if(!(rolesFromLocalStorage instanceof Array) || rolesFromLocalStorage.length === 0){
                        answer = false
                        return
                    }

                    // check if the user owns the required role(s) to access the route
                    answer = requiredRoles.every((requiredRole) => rolesFromLocalStorage.includes(requiredRole))
                }else{
                    alert("Sie sind Offline und nicht Angemeldet. \n(Der Anmelde Token existiert nicht)")
                    return false
                }
            
            }    
            
        })
        
        
        return true

    }
}



