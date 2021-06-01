import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './app.authguard';

//Audio Upload
import { AudioUploadComponent } from './components/audio-upload/audio-upload.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/audioupload',
    pathMatch: 'full'
  },
  {
    path: 'audioupload',
    component: AudioUploadComponent,
    canActivate: [AuthGuard],
    data: { roles: ['visitor'] }
  },
  {
    path: '**',
    redirectTo: '/audioupload',
    pathMatch: 'full'
  },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
