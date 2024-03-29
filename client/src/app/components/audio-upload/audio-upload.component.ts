import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { take } from 'rxjs/operators';

import { AuthService } from 'src/app/services/authservice/auth-service.service';
import { AudioUploadService } from '../../services/audio-upload/audio-upload.service';
import { IndexedDBService } from '../../services/indexedDB/indexed-db.service';
import { OfflineFunctionsService } from '../../services/offline-functions/offline-functions.service';
import { TranslaterService } from '../../services/translater/translater.service';

import * as RecordRTC from 'recordrtc';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-audio-upload',
  templateUrl: './audio-upload.component.html',
  styleUrls: ['./audio-upload.component.scss']
})
export class AudioUploadComponent implements OnInit  {

  constructor(
    private AudioUpload: AudioUploadService,
    private translater: TranslaterService,
    protected readonly offlineFunctions: OfflineFunctionsService,
    protected readonly IndexedDB: IndexedDBService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    // check if the funktion 'navigator.geolocation' exist
    if (!navigator.geolocation) {
      this.translater.translationAlert("GPS-NO-SUPPORT")
    }

    // init indexedDB
    this.IndexedDB.initDB()

    // get User Name
    this.username.setValue(this.authService.getUserData().sub);

    // check if Online
    this.isOffline = !window.navigator.onLine
    window.onoffline = (event) => {
      this.isOffline = true
    };
    window.ononline = (event) => {
      this.isOffline = false
    };

    // get all Audios
    if (!this.isOffline) {
      this.listallAudiosFromNextCloudfromuser();
    }
    this.listAllAudiosFromIndexedDB();

    // get Share Link
    this.redirectToNextCloudFolder();
  }

  async ngOnDestroy() {
    this.recordingAbort();

    // unsubscribe all Observers 
    this.observers.forEach(observer => {
      observer.unsubscribe()
    });
  }

  // for avoiding Memory Leaks unsubscribe all Observers 
  observers: any = []

  // false=> Online; true=> Offline
  isOffline: boolean = false;

  // take the Username from Keycloak
  public isLoggedIn = false;
  public userProfile = null;

  // check if the Username Input is valid
  username = new FormControl('', Validators.pattern('[a-zA-Z1-90 _]*'));

  // for Recording
  public_recorder: any;
  public_stream: any;
  recorder_settings: any = {
    type: 'audio',
    recorderType: RecordRTC.StereoAudioRecorder,
    mimeType: 'audio/wav',
    disableLogs: true,
    numberOfAudioChannels: 1,
  }
  recordingstarted: string;

  // Geolocation
  location: any = {
    geolocation: {},
    id: undefined
  }
  gps_status: string = "false"

  /// Table
  // Table Columns
  displayedColumns = ["check", "date", "name", "position", "actions"];
  displayedColumnsCloud = ["date", "name", "position"];
  // All saved Audios (only contains ID and Filename)
  allAudios: any;
  allAudiosFromNextCloud: any;
  // for the Checkbox "alle Auswählen"
  allchecked: boolean = false;
  allcheckedForNextCloud: boolean = false;

  // for the Audio Player
  @ViewChild('audioOption') audioPlayerRef: ElementRef;
  @ViewChild('src') srcRef: ElementRef;

  // show the state from "Nach NextCloud uploaden"
  // aslong as the NextCloud Upload isnt finished, the buttons "Nach NextCloud uploaden" and "markierte Löschen" should be deactivated
  nextcloudstatus: string = ""

  // NextCloud Share Link
  nextCloudShareLink: string = ""
  
  /**/

  // RecorderRTC Functions
  async recordingStart() {
    // check if the Input is valid
    if (this.username.valid) {
      // deactivate input
      this.username.disable();
    } else {
      if (this.username.enabled) {
        return
      }
    }

    // navigator.mediaDevices.getUserMedia() can only steam audio from a microphone, when the website has a SSL Certificate (HTTPS)
    // the documentation told me. Correct me if i am wrong
    try {
      if (this.public_recorder == undefined || this.public_stream == undefined) {
        this.public_stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.public_recorder = new RecordRTC(this.public_stream, this.recorder_settings);
      } else {
        if (this.public_stream.getAudioTracks()[0].readyState == "ended") {
          this.public_stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.public_recorder = new RecordRTC(this.public_stream, this.recorder_settings);
        }
      }
    } catch (e) {
      console.log(e.name + ": " + e.message);
    }

    try {
      switch (this.public_recorder.getState()) {
        case "recording":
          this.public_recorder.pauseRecording();
          break;
        case "paused":
          this.public_recorder.resumeRecording();
          break;
        default:
          this.public_recorder.startRecording();
          break;
      }
      this.recordingstarted = this.public_recorder.getState()
    } catch (e) {
      console.log(e.name + ": " + e.message);
    }
  }
  recordingAbort() {
    try {
      if (this.public_recorder) {
        if (this.public_recorder.getState() == "paused" || this.public_recorder.getState() == "recording") {
          // activate Input
          this.username.enable()
          // stop recording and streaming
          this.public_recorder.reset()
          this.public_stream.getTracks().forEach(function (track) {
            track.stop();
          });

          this.recordingstarted = this.public_recorder.getState()
        }
      }
    } catch (e) {
      console.log(e.name + ": " + e.message);
    }
  }
  upload_audio() {
    try {
      var filename
      var name;

      // activate Input
      this.username.enable()

      // check Input
      if (this.username.invalid) {
        this.recordingAbort()
        return
      } else {
        // get Value from Input
        name = this.username.value
        name = name.split(" ").join("_")
      }

      if (this.gps_status != "true" && this.gps_status != "false") {
        this.recordingAbort()
        return
      }

      var audio_req = {}

      this.public_recorder.stopRecording(() => {
        // create Datetime
        let date_ob = new Date()
        // current date
        let date = ("0" + date_ob.getDate()).slice(-2);
        // current month
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        // current year
        let year = date_ob.getFullYear();
        // current hours
        let hours = ("0" + date_ob.getHours()).slice(-2);
        // current minutes
        let minutes = ("0" + date_ob.getMinutes()).slice(-2);
        // current seconds
        let seconds = ("0" + date_ob.getSeconds()).slice(-2);
        // Time zone
        let Time_zone = "UTC+" + date_ob.getTimezoneOffset() / 60 * (-1)

        // save date & time in ISO 8601 Format
        let fulldate = year + "-" + month + "-" + date + "T" + hours + minutes + seconds + Time_zone;
        filename = fulldate

        // save Filename
        if (name && name !== "") {
          filename = filename + "--" + name
        } else {
          filename = filename + "--" + "undefinded"
        }

        if (this.location.geolocation.latitude && this.location.geolocation.longitude) {
          filename = filename + "--" + this.location.geolocation.latitude + "-" + this.location.geolocation.longitude
        }

        filename = filename + "." + this.recorder_settings.mimeType.split("/")[1]
        audio_req["filename"] = filename

        // get Audio from RekorderRTC and save it
        audio_req["blob"] = this.public_recorder.getBlob();

        // end RekorderRTC
        this.public_recorder.reset();
        this.public_stream.getTracks().forEach(function (track) {
          track.stop();
        });
        this.recordingstarted = this.public_recorder.getState()

        // send
        if (this.gps_status == "true") {
          if (this.location.geolocation.latitude && this.location.geolocation.longitude) {
            this.IndexedDB.put(audio_req);
            this.listAllAudiosFromIndexedDB()
          } else {
            this.translater.translationAlert("GPS-NO-LOCATION")
          }
        } else if (this.gps_status == "false") {
          this.IndexedDB.put(audio_req);
          this.listAllAudiosFromIndexedDB()
        }

      });
    } catch (e) {
      console.log(e.name + ": " + e.message);
      if (this.public_recorder.getState() == "paused" || this.public_recorder.getState() == "recording") {
        this.public_recorder.reset();
      }

      this.public_stream.getTracks().forEach(function (track) {
        track.stop();
      });

      if (this.location.id != []) {
        this.location.id.forEach(element => {
          navigator.geolocation.clearWatch(element);
        });
        this.location = {
          geolocation: {},
          id: []
        }
      }
    }
  }

  // takes the Geolocation from the User
  async watchgeolocation(checked: boolean) {
    // checks if the Browser supports 'navigator.geolocation'
    if (!navigator.geolocation) {
      this.translater.translationAlert("GPS-NO-LOCATION")
      return
    }

    // deactivate Geolocation
    if (!checked) {
      if (this.location.id != undefined) {
        navigator.geolocation.clearWatch(this.location.id);

        this.location = {
          geolocation: {},
          id: undefined
        }
      }
      this.recordingAbort()
      this.gps_status = "false"
      return
    }

    this.gps_status = "WAIT"

    // activate Geolocation
    this.location.id = navigator.geolocation.watchPosition(
      (location) => {
        // Success
        this.location.geolocation = {
          'latitude': Math.round(location.coords.latitude * 1000000) / 1000000,
          'longitude': Math.round(location.coords.longitude * 1000000) / 1000000,
        }

        this.gps_status = "true"


      }, (error) => {
        // Error
        if (error.code == error.PERMISSION_DENIED) {
          console.log("Error " + error.code + ": " + error.message)
          this.gps_status = "permission"
        } else {
          console.log("Error " + error.code + ": " + error.message)
          this.gps_status = "error"
        }
      }, {
      // Option
      enableHighAccuracy: true,
      maximumAge: 10,
    }
    );
  }

  /// Get All Data from the Source and show it in the Tables
  listAllAudiosFromIndexedDB() {
    this.IndexedDB.getAll().then((data) => {
      let tmp_allAudios = data
      for (let index in tmp_allAudios) {
        tmp_allAudios[index].check = false
        tmp_allAudios[index].date = this.getDate(tmp_allAudios[index].filename)
        tmp_allAudios[index].name = tmp_allAudios[index].filename.split('--')[1].replace("_", " ").replace('.wav', '')
      }

      tmp_allAudios.sort((a,b) => a - b);

      this.allchecked = false;
      this.allAudios = tmp_allAudios
    })
  }
  listallAudiosFromNextCloudfromuser() {
    this.observers.push(
      this.AudioUpload.listOfNextCloudFolder().pipe(take(1)).subscribe(data => {
        let tmpAllAudiosFromNextCloud:any = data
        for (let index in tmpAllAudiosFromNextCloud) {
          tmpAllAudiosFromNextCloud[index].check = false;
          tmpAllAudiosFromNextCloud[index].date = this.getDate(tmpAllAudiosFromNextCloud[index].filename)
          tmpAllAudiosFromNextCloud[index].name = tmpAllAudiosFromNextCloud[index].filename.split('--')[1].replace("_", " ").replace('.wav', '')
        }

        tmpAllAudiosFromNextCloud.sort((a,b) => a - b);

        this.allAudiosFromNextCloud = tmpAllAudiosFromNextCloud
        this.allchecked = false;
      })
    )
  }

  /// Basic Table Functions
  // get Date and convert it to a readable String
  getDate = function (filename) {
    
    let dateStr = filename.split('--')[0];

    let YearMonthDay = dateStr.substr(0, 10);
    let hour = dateStr.substr(11, 2);
    let minute = dateStr.substr(13, 2);
    let seconds = dateStr.substr(15, 2);
    let zone = dateStr.substr(17);

    let date = `${YearMonthDay} ${hour}:${minute}:${seconds} ${zone}`
    
    return date
  }
  // Play a Blob in a HTML Audio Element
  async playAudio(blob){
    try{
      const bloburl = URL.createObjectURL(blob);

      this.srcRef.nativeElement.src = bloburl
      this.audioPlayerRef.nativeElement.load()
      this.audioPlayerRef.nativeElement.play()

    }catch (e) {
      console.log("Audio-Error: ")
      console.log(e.name + ": " + e.message);
      this.translater.translationAlert("NO-AUDIO-PLAY")
    }
  }

  // Functions for the "Meine Daten" Table
  playAudioFromIndexedDB(audioid) {
    this.IndexedDB.getAudio(audioid).then((blob) => {
      this.playAudio(blob)
    });
  }
  downloadAudioFromIndexedDB(audioid, audioname) {
    this.IndexedDB.getAudio(audioid).then((blob) => {
      saveAs(blob, audioname)
      this.listAllAudiosFromIndexedDB()
    });
  }

  // Functions to delete or send Audio Files from the "Meine Daten" Table
  async deletemarkedfiles(audios) {
    if (await this.translater.translationConfirm("DELETE-ALL")) {
      for (let audio of audios.filter(audio => audio.check)) {
        this.IndexedDB.delete(audio.filename).then(() => {
          this.listAllAudiosFromIndexedDB()
        })
      }
    }
  }
  async uploadToNextCloud() {
    var checked_audios = this.allAudios.filter(audio => audio.check)

    if (checked_audios.length == 0) {
      this.nextcloudstatus = "NO-AUDIO-SELECT"
      return
    }
    
    if (await this.translater.translationConfirm("NC-STATUS.CONFIRM")) {
      this.nextcloudstatus = "WAIT"
      let audio_request = new FormData();

      for (let audio of checked_audios) {
        let blob = await this.IndexedDB.getAudio(audio.id)
        audio_request.append("blobToNextCloud", blob, audio.filename)
      }

      this.observers.push(
        this.AudioUpload.nextcloudupload(audio_request).pipe(take(1)).subscribe(
          (data) => {
            this.listAllAudiosFromIndexedDB();
            this.listallAudiosFromNextCloudfromuser();
            this.nextcloudstatus = "SUCCESS";

            // If not all audios uploaded successfully, don't delete everything
            if (data['error'] != undefined) {
              this.translater.translationAlert("NC-ERROR." + data['error'])
              for (let audio of checked_audios) {
                // dont delete it            
                if (data['failedFiles'].indexOf(audio.filename) !== -1) {
                  continue
                }
                // delete it
                this.IndexedDB.delete(audio.filename).then(() => {
                  this.listAllAudiosFromIndexedDB()
                });
              }

            } else {
              for (let audio of checked_audios) {
                this.IndexedDB.delete(audio.filename).then(() => {
                  this.listAllAudiosFromIndexedDB()
                });
              }
            }
          },
          (error) => {
            this.translater.translationAlert("NC-ERROR." + error.error);
            this.listAllAudiosFromIndexedDB();
            this.listallAudiosFromNextCloudfromuser();
            this.nextcloudstatus = "RELOAD";
          }
        )
      )

    } else {
      return;
    }

  }

  // for the "Meine Daten" Checkboxes
  checkall_indexedDB(completed: boolean) {
    if (completed) {
      for (let index in this.allAudios) {
        this.allAudios[index].check = true;
      }
      this.allchecked = true
    } else {
      for (let index in this.allAudios) {
        this.allAudios[index].check = false;
      }
      this.allchecked = false
    }
  }
  someComplete_indexedDB(): boolean {
    if (this.allAudios == null || this.allAudios == undefined || this.allAudios == []) {
      return false;
    }

    
    if (this.allAudios.filter(t => t.check).length > 0) {
      if (this.allAudios.length == this.allAudios.filter(t => t.check).length) {
        this.allchecked = true;
        return false;
      }
      this.allchecked = false;
      return true;
    }
    this.allchecked = false;
    return false;
  }

  // for the "NextCloud" Checkboxes
  checkall_NextCloud(completed: boolean) {
    if (completed) {
      for (let index in this.allAudiosFromNextCloud) {
        this.allAudiosFromNextCloud[index].check = true;
      }
      this.allcheckedForNextCloud = true
    } else {
      for (let index in this.allAudiosFromNextCloud) {
        this.allAudiosFromNextCloud[index].check = false;
      }
      this.allcheckedForNextCloud = false
    }
  }
  someComplete_NextCloud(): boolean {
    if (this.allAudiosFromNextCloud == null || this.allAudiosFromNextCloud == undefined || this.allAudiosFromNextCloud == []) {
      return false;
    }
    if (this.allAudiosFromNextCloud.filter(t => t.check).length > 0) {
      if (this.allAudiosFromNextCloud.length == this.allAudiosFromNextCloud.filter(t => t.check).length) {
        this.allcheckedForNextCloud = true;
        return false;
      }
      this.allcheckedForNextCloud = false;
      return true;
    }
    this.allcheckedForNextCloud = false;
    return false;
  }

  redirectToNextCloudFolder(){
    this.observers.push(
      this.AudioUpload.getUrlfromNextCloudFolder().pipe(take(1)).subscribe(
        (res)=>{
          this.nextCloudShareLink = res['url']
          localStorage.setItem("nextCloudShareLink", res['url'])
        },
        (error)=>{
          console.log(error)
        }
      )
    )
  }

  // Experimental functions
  speechtotext(index) {
    this.observers.push(
      this.AudioUpload.speechtotext(this.allAudios[index].filename).pipe(take(1)).subscribe(data => {
        this.allAudios[index].speechtotext = data[0]
        this.json_upload(this.allAudios[index].filename, data[0])
      })
    )
  }
  json_upload(audioname, speechtotext) {
    let request = {
      "jsonname": audioname,
      "data": {
        "speechtotext": speechtotext
      }
    }
    this.observers.push(
      this.AudioUpload.upload_json(request).pipe(take(1)).subscribe(data => {
      })
    )

  }
  
  nxtcPos(element) {
    if (element.filename.split('--').length > 2) {
      return element.filename.split('--')[2].replace('-', ',').replace('.wav', '');
    }
    return -1;
  }
}