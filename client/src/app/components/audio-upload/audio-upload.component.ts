import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { AudioUploadService } from '../../services/audio-upload/audio-upload.service';
import { IndexedDBService } from '../../services/indexedDB/indexed-db.service';
import { OfflineFunctionsService } from '../../services/offline-functions/offline-functions.service';

import * as RecordRTC from 'recordrtc';
import { saveAs } from 'file-saver';

import { TranslaterService } from '../../services/translater/translater.service';

import { AuthService } from 'src/app/services/authservice/auth-service.service';


@Component({
  selector: 'app-audio-upload',
  templateUrl: './audio-upload.component.html',
  styleUrls: ['./audio-upload.component.scss']
})
export class AudioUploadComponent implements OnInit {

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

    this.isOffline = !window.navigator.onLine
    window.onoffline = (event) => {
      this.isOffline = true
    };
    window.ononline = (event) => {
      this.isOffline = false
    };

    if (!this.isOffline) {
      this.username.setValue(this.authService.getUserData().sub);
      this.listallAudiosFromNextCloudfromuser();
    } else {
      this.username.setValue(this.authService.getUserData().sub);
    }

    this.listAllAudiosFromIndexedDB();

  }

  async ngOnDestroy() {
    this.recordingAbort();
  }

  // take the Username from Keycloak
  public isLoggedIn = false;
  public userProfile = null;

  // check if the Input is valid
  username = new FormControl('', Validators.pattern('[a-zA-Z1-90 _]*'));

  // for RecorderRTC
  public_recorder: any;
  public_stream: any;
  recorder_einstellungen: any = {
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

  // for the Audio Player
  @ViewChild('stream') playerRef: ElementRef<HTMLAudioElement>;
  public_audioblob: any;
  playaudio = {}

  // for the table
  allAudios: any;
  allAudiosFromNextCloud: any;
  // for the Checkbox "alle Auswählen"
  allchecked: boolean = false;
  allcheckedForNextCloud: boolean = false;

  // show the state from "Nach NextCloud uploaden"
  nextcloudstatus: string = ""
  // aslong as the NextCloud Upload isnt finished, the buttons "Nach NextCloud uploaden" and "markierte Löschen" should be deactivated

  isOffline: boolean = false;

  // Table
  displayedColumns = ["check", "date", "name", "position", "actions"];
  displayedColumnsCloud = ["date", "name", "position", "actions"];

  // Table - Get Date
  getDate = function (filename) {
    let dateStr = filename.split('--')[0];
    let day = dateStr.substr(8, 2);
    var months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    let month = months[dateStr.substr(5, 2).replace(/^0+/, '') - 1];
    let year = dateStr.substr(0, 4);
    let hour = dateStr.substr(11, 2);
    let minute = dateStr.substr(12, 2);
    let seconds = dateStr.substr(14, 2);
    let zone = dateStr.substr(17);
    let date = new Date(`${year} ${month} ${day} ${hour}:${minute}:${seconds} ${zone}`);
    return date.toUTCString();
  }

  // play Audio from a Blob 
  playAudio(blob, id) {
    try {


      //https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
      //https://stackoverflow.com/questions/54814092/angular-viewchild-audio-element-as-htmlaudioelement

      this.playAudio[id] = {}
      this.playAudio[id].audioplayer = new Audio();
      this.playAudio[id].paused = false;

      let bloburl = URL.createObjectURL(blob);
      this.playAudio[id].audioplayer.src = bloburl;
      this.playAudio[id].audioplayer.load();
      this.playAudio[id].audioplayer.play();

      //this.playerRef.nativeElement.src =  bloburl

      //this.playAudio[id].audioplayer.addEventListener("timeupdate", (currentTime)=>{
      //this.songTime = currentTime;
      //console.log(this.songTime)
      //});

      this.playAudio[id].audioplayer.addEventListener("ended", () => {
        this.playAudio[id] = undefined
      });

    } catch (e) {
      console.log("Audio-Error: ")
      console.log(e.name + ": " + e.message);
      this.translater.translationAlert("NO-AUDIO-PLAY")
    }
  }

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
        this.public_recorder = new RecordRTC(this.public_stream, this.recorder_einstellungen);
      } else {
        if (this.public_stream.getAudioTracks()[0].readyState == "ended") {
          this.public_stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.public_recorder = new RecordRTC(this.public_stream, this.recorder_einstellungen);
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
  async upload_audio() {
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

        filename = filename + "." + this.recorder_einstellungen.mimeType.split("/")[1]
        audio_req["filename"] = filename

        // get Audio from RekorderRTC
        this.public_audioblob = this.public_recorder.getBlob();
        // save Audio
        audio_req["blob"] = this.public_audioblob

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

  listAllAudiosFromIndexedDB() {
    this.IndexedDB.getAll().then((data) => {
      this.allAudios = data
      for (let index in this.allAudios) {
        this.allAudios[index].check = false
      }
      this.allchecked = false;
    })
  }
  listallAudiosFromNextCloudfromuser() {
    this.AudioUpload.listOfNextCloudFolder().subscribe(data => {
      this.allAudiosFromNextCloud = data;
      for (let index in this.allAudiosFromNextCloud) {
        this.allAudiosFromNextCloud[index].check = false;
      }
      this.allchecked = false;
    })
  }

  // Functions for the Table
  playoneaudio(audioid, id) {
    this.IndexedDB.getAudio(audioid).then((blob) => {
      this.playAudio(blob, id)
    })
  }
  downloadoneaudio(audioname, audioid) {
    this.IndexedDB.getAudio(audioid).then((blob) => {
      saveAs(blob, audioname)
      this.listAllAudiosFromIndexedDB()
    });
  }
  async deletemarkedfiles(audios) {
    if (await this.translater.translationConfirm("DELETE-ALL")) {
      for (let audio of audios.filter(audio => audio.check)) {
        this.IndexedDB.delete(audio.filename).then(() => {
          this.listAllAudiosFromIndexedDB()
        })
      }
    }
  }

  // for the Checkboxes
  checkall(completed: boolean) {
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
  someComplete(): boolean {
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

  // for the NextCloud Checkboxes
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

  // NextCloud Functions
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

      this.AudioUpload.nextcloudupload(audio_request).subscribe(
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
      );

    } else {
      return;
    }

  }
  playAudioFromNextCloud(audioname, id) {
    this.AudioUpload.getOneAudioFromNextCloud(audioname).subscribe(blob => {
      this.playAudio(blob, id)
    });
  }
  downloadAudioFromNextCloud(audioname) {
    this.AudioUpload.getOneAudioFromNextCloud(audioname).subscribe(blob => {
      saveAs(blob, audioname)
    });
  }
  redirectToNextCloudFolder(){
    
    this.AudioUpload.getUrlfromNextCloudFolder().subscribe(
      (res)=>{
        console.log(res)
      }
    )

  }

  // Experimental functions
  speechtotext(index) {
    this.AudioUpload.speechtotext(this.allAudios[index].filename).subscribe(data => {
      this.allAudios[index].speechtotext = data[0]
      this.json_upload(this.allAudios[index].filename, data[0])
    });
  }
  json_upload(audioname, speechtotext) {
    let request = {
      "jsonname": audioname,
      "data": {
        "speechtotext": speechtotext
      }
    }
    this.AudioUpload.upload_json(request).subscribe(data => {
    });
  }
  
  nxtcPos(element) {
    if (element.filename.split('--').length > 2) {
      return element.filename.split('--')[2].replace('-', ',').replace('.wav', '');
    }
    return -1;
  }
}