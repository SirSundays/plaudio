import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AudioUploadService {

  node_url = environment.apiServer + "/api/pre"
  
  constructor(private http: HttpClient) { }
  /// nextcloud API
  nextcloudupload(audioname){
    return this.http.post(this.node_url + '/nextcloud/hochladen', audioname);
  }
  listOfNextCloudFolder(){
    return this.http.get(this.node_url + '/nextcloud/getfolder');
  }
  getOneAudioFromNextCloud(audioname){
    return this.http.get(this.node_url + '/nextcloud/file/' + audioname, {responseType: 'blob'});
  }
  getUrlfromNextCloudFolder(){
    return this.http.get(this.node_url + '/nextcloud/url')
  }

  // Experimental functions
  speechtotext(audioname){
    return this.http.get(this.node_url + '/audio/speechtotext/' + audioname);
  }
  upload_json(request){
    return this.http.post(this.node_url + '/json/hochladen', request);
  }
}
