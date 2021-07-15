import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authservice/auth-service.service';
import { TranslaterService } from '../../services/translater/translater.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {
  form: FormGroup;

  constructor(
      private fb: FormBuilder, 
      private authService: AuthService, 
      private router: Router,
      private translater: TranslaterService
    ){
      this.form = this.fb.group({
        username: ['', Validators.required],
        password: ['', Validators.required]
      });
    } 

  login() {
    const val = this.form.value;

    if (val.username && val.password) {
      this.authService.login(val.username, val.password)
        .subscribe(
          (res) => {
            this.authService.setSession(res);
            this.router.navigateByUrl('/');
          },
          (error)=>{
            if(error.status == 401){
              console.log("Unauthorized")
              this.translater.translationAlert("AUTH."+"UNAUTHORIZED")
            }else{
              this.translater.translationAlert("NC-ERROR.UNEXPECTED")
            }
          }
        );
    }
  }

  ngOnInit(): void {
  }

}
