import { Injectable } from '@angular/core';

// indexeddb
import Dexie from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {

  constructor() { }
  public db;
  initDB(){
    this.db = new Dexie('AudioDB');
    this.db.version(1).stores({
        filename: '++id, &filename, pos',
        audio: 'id', // here comes the audio file
    });
  }

  async deleteDB(){
    await this.db.delete();
  }

  async put(req){
    let id;
    if(req.filename && req.blob){
      if (req.filename.split('--').length > 2) {
        id = await this.db["filename"].put({"filename": req.filename, "pos": req.filename.split('--')[2].replace('-', ',').replace('.wav', '')});
      } else {
        id = await this.db["filename"].put({"filename": req.filename, "pos": "-1"});
      }
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
    let obj = await this.db["filename"].get({"filename": filename})
    let id = obj.id
    
    await this.db["filename"].where("id").anyOf(id).delete()
    await this.db["audio"].where("id").anyOf(id).delete()
    
  }

}
