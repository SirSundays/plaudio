import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslaterService {
   
  constructor(private translate: TranslateService) { }

  translationAlert(key) {
    return new Promise((resolve, reject) => {
      let trans = "";
      this.translate.get(key).subscribe({
        next: (res: string) => {
          trans = res;
        },
        error: (err) => {
          reject(err);
        },
        complete: () => {
          resolve(alert(trans));
        }
      }
      );
    })
  }

  async translationConfirm(key) {
    return new Promise((resolve, reject) => {
      let trans = "";
      this.translate.get(key).subscribe({
        next: (res: string) => {
          trans = res;
        },
        error: (err) => {
          reject(err);
        },
        complete: () => {
          resolve(confirm(trans));
        }
      }
      );
    });
  }

}
