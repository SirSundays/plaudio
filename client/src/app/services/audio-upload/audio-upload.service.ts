import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AudioUploadService {

  node_url = environment.apiServer;

  constructor(private http: HttpClient) { }
  
  upload_audio(request){
    return this.http.post(this.node_url + '/api/pre/audio/hochladen', request);
  }
  listallaudiosfromuser(){
    return this.http.get(this.node_url + '/api/pre/list_audios');
  }
  listallaudiosfromarchivfromuser(){
    return this.http.get(this.node_url + '/api/pre/list_archiv');
  }
  getoneaudio(audioname){
    return this.http.post(this.node_url + '/api/pre/getaudio/' + audioname, null, {responseType: 'blob'})
  }
  getoneaudiofromarchive(audioname){
    return this.http.post(this.node_url + '/api/pre/getaudiofromarchive/' + audioname, null, {responseType: 'blob'})
  }

  
  deletefile(audioname){
    return this.http.delete(this.node_url + '/api/pre/audio/delete/' + audioname);
  }
  deletefilefromarchive(audioname){
    return this.http.delete(this.node_url + '/api/pre/audio/deletefromarchive/' + audioname);
  }
  
  nextcloudupload(audioname){
    return this.http.post(this.node_url + '/api/pre/nextcloud/hochladen', audioname);
  }
  listOfNextCloudFolder(){
    return this.http.get(this.node_url + '/api/pre/nextcloud/getfolder');
  }
  getOneAudioFromNextCloud(audioname){
    return this.http.get(this.node_url + '/api/pre/nextcloud/file/' + audioname, {responseType: 'blob'});
  }

  // Experimental functions
  speechtotext(audioname){
    return this.http.get(this.node_url + '/api/pre/audio/speechtotext/' + audioname);
  }
  upload_json(request){
    return this.http.post(this.node_url + '/api/pre/json/hochladen', request);
  }
}
