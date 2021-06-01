import { Injectable } from '@angular/core';

// indexeddb
import Dexie from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {

  constructor() { }
  public db = new Dexie('AudioDB');
  initDB(){
    this.db = new Dexie('AudioDB');
    this.db.version(1).stores({
        filename: '++id, &filename',
        audio: 'id', // here comes the audio file
        token: "id, token"
    });
  }

  async deleteDB(){
    await this.db.delete();
  }

  async put(req){
    let id;
    if(req.filename && req.blob){
      id = await this.db["filename"].put({"filename": req.filename});
      await this.db["audio"].put({"id": id, "blob": req.blob});
    }else{
      return
    }
  }

  async getAll(){
    let audios = await this.db["filename"].toArray();
    return audios
  }

  async getAudio(id){
    let audio = await this.db["audio"].get(id)
    return audio.blob
  }

  async delete(filename){
    let id = await this.db["filename"].where("filename").anyOf(filename).delete()
    await this.db["audio"].where("id").anyOf(id).delete()
  }

  async putToken(token){
    this.db['token'].put({"id": 1, "token": token})
    
  }

}
