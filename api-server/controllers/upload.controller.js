const fs = require('fs'); 
const url = require('url');
const path = require('path')

const jwt_decode = require('jwt-decode');

//import Clienten
const nextcloudClient = require("nextcloud-node-client")
const users = JSON.parse(fs.readFileSync('./users.json'));

const dialogflow = require('@google-cloud/dialogflow');

const UploadController = {
    //NextCloud Funktionen
    async uploadToNextCloud(req, res){
        try{
            
            /// check Data and Name
            const ausgewählte_audios = req.files["blobToNextCloud"]
            if(ausgewählte_audios.length == 0 ){
                res.statusCode = 400;
                res.end(`Error: Es wurden keine Audios ausgewählt`);
                return
            }else{
                let filename
                // check if the Name is valid. (Invalid Symbols / or \)
                for(let audio of ausgewählte_audios){
                    filename = new String(audio.originalname) // is now a String instead of a string

                    if(audio.originalname.indexOf('/') != -1 || audio.originalname.indexOf('\\') != -1){  
                        throw {
                            erwartet: true,
                            status: 400,
                            name: "FILENAME"
                        }
                    }
                }
            }
            
            /// Create the Client for NextCloud
            // Client Credentials is in docker/docker-compose.yml
            const client = new nextcloudClient.Client();
            
            /// create folder and collect all necessery Information   
            // take User Name
            const originalName = jwt_decode(req.headers.authorization.replace("Bearer ","")).sub;
            const name = originalName.split(" ").join("_")
            
            // take Company Name
            let userWname = users.filter(user => user.username === originalName);
            let companyName = userWname[0].company

            // Complete Path to the Folder in which all selected Audios are saved
            var nextcloud_folder_path
            if(companyName != "" && companyName != undefined){
                nextcloud_folder_path = "Audio_Dateien_von_den_Gaertnern/" + "Unternehmen_" + companyName + "/" + name
            }else{
                nextcloud_folder_path = "Audio_Dateien_von_den_Gaertnern/" + name
            }

            // create Folder
            var nextcloud_folder = await client.createFolder(nextcloud_folder_path);

            /// The file is taken from here. Collect all necessary Information         
            for(let audio of ausgewählte_audios){
                // check if the File exist
                let audio_buffer;
                if(audio.buffer instanceof Buffer){
                    // get Audio
                    audio_buffer = audio.buffer
                }else{
                    // Error 
                    throw {
                        erwartet: true,
                        "name":"AUDIO"
                    }
                }

                await nextcloud_folder.createFile(audio.originalname, audio_buffer);
            }
            
            
            /// upload the Audios to NextCloud
            var upload = new nextcloudClient.UploadFilesCommand(client, { nextcloud_folder });
            await upload.execute();

            /// checks whether the files have been uploaded   
            let getfolder = await client.getFolder(nextcloud_folder_path);

            let isntUploaded = {
                error: "UPLOADFAILED",
                failedFiles: []
            }

            for(let audio of ausgewählte_audios){
                let getfile = await getfolder.getFile(audio.originalname);

                if(getfile == null){
                    // files wasnt uploaded
                    isntUploaded.failedFiles.push(audio.originalname);
                }
            }
            
            /// Sendet ein OK 
            if(isntUploaded.failedFiles.length == 0){
                res.statusCode = 200;
                res.send([]);
            }else{
                res.statusCode = 200;
                res.send(isntUploaded);
            }
            
        }catch(e){
            if(e.erwartet){
                res.statusCode = e.status | 500;
                res.end(e.name);
            }else{
                res.statusCode = 500;
                res.end("UNEXPECTED");
                console.log(e)
            }
        }
    },
    async listOfNextCloudFiles(req, res){
        try{
            /// Get Username
            const originalName = jwt_decode(req.headers.authorization.replace("Bearer ","")).sub;
            const name = originalName.split(" ").join("_")
            
            // take Company Name
            let userWname = users.filter(user => user.username === originalName);
            let companyName = userWname[0].company

            // Complete Path to the Folder in which all selected Audios are saved
            var nextcloud_folder_path
            if(companyName != "" && companyName != undefined){
                nextcloud_folder_path = "Audio_Dateien_von_den_Gaertnern/" + "Unternehmen_" + companyName + "/" + name
            }else{
                nextcloud_folder_path = "Audio_Dateien_von_den_Gaertnern/" + name
            }

            /// Client Credentials can be found in docker-compose.yml  
            const client = new nextcloudClient.Client();
            /// Get one Audio from the Folder
            const folder = await client.getFolder(nextcloud_folder_path);
            
            /// check if the Folder is empty
            if(folder == null || folder == undefined){
                res.status(200).send([])
                return
            }

            /// get all Files
            const files = await folder.getFiles()

            /// get all File Names
            var filename = []
            for(let file of files){
                let splitName = file.memento.baseName.split(".")
                let mimeTyp = splitName[splitName.length -1]
                if(mimeTyp == "wav"){
                    filename.push({filename: decodeURIComponent(file.memento.baseName)})
                }
            }
            
            res.status(200).send(filename)
        }catch(e){
            console.log(e);
            res.statusCode = 500;
            res.end(`Error beim versuch die Dateien aus dem NextCloud zu bekommen: \n` + e.name + ": " + e.message);
        }
    },
    async getOneAudioFromNextCloud(req, res){
        try{
            /// Get Username
            const originalName = jwt_decode(req.headers.authorization.replace("Bearer ","")).sub;
            const name = originalName.split(" ").join("_")
            
            // take Company Name
            let userWname = users.filter(user => user.username === originalName);
            let companyName = userWname[0].company

            // Complete Path to the Folder in which all selected Audios are saved
            var nextcloud_folder_path
            if(companyName != "" && companyName != undefined){
                nextcloud_folder_path = "Audio_Dateien_von_den_Gaertnern/" + "Unternehmen_" + companyName + "/" + name
            }else{
                nextcloud_folder_path = "Audio_Dateien_von_den_Gaertnern/" + name
            }

            /// Get Audioname
            const audionamearray = url.format({ pathname: req.originalUrl }).split('/');
            const audioname = decodeURI(audionamearray[audionamearray.length -1]) //decodeURI wandelt %C3%9C in ü um

            /// Client Credentials can be found in docker-compose.yml  
            const client = new nextcloudClient.Client();
            /// Get one Audio from the Folder
            const file = await client.getFile(nextcloud_folder_path + "/" + audioname);
            const buffer = await file.getContent();

            res.status(200).send(buffer)
        }catch(e){
            console.log(e);
            res.statusCode = 500;        
        }
    },
    async getNextCloudUrl(req, res){
        try{
            /// Get Username
            const originalName = jwt_decode(req.headers.authorization.replace("Bearer ","")).sub;
            const name = originalName.split(" ").join("_")
            
            // take Company Name
            let userWname = users.filter(user => user.username === originalName);
            let companyName = userWname[0].company

            // Complete Path to the User Folder
            var nextcloud_folder_path
            var nextcloud_subfolder_path
            if(companyName != "" && companyName != undefined){
                nextcloud_folder_path = "Audio_Dateien_von_den_Gaertnern/" + "Unternehmen_" + companyName + "/" + name
                nextcloud_subfolder_path = "Audio_Dateien_von_den_Gaertnern/" + "Unternehmen_" + companyName + "/" 
            }else{
                nextcloud_folder_path = "Audio_Dateien_von_den_Gaertnern/" + name
                nextcloud_subfolder_path = undefined
            }

            /// Create the Client for NextCloud
            const client = new nextcloudClient.Client();
            
            /// use Username to check if the Folder exist 
            var userFolder = await client.getFolder(nextcloud_folder_path);
            
            if(userFolder == null || userFolder == undefined){
                // create folder
                let nextcloud_folder = await client.createFolder(nextcloud_folder_path);
                let upload = new nextcloudClient.UploadFilesCommand(client, { nextcloud_folder });
                await upload.execute();

                userFolder = await client.getFolder(nextcloud_folder_path);
            }

            /// either it finds a comment in the Folder or it throws an error when its empty
            var comment
            try{
                comment = await userFolder.getComments()
            }catch(e){
                comment = []
            }
            


            /// if the Folder dont has a Comment than create a share Link and add it as a Comment to the Folder
            var shareURL
            if(comment.length == 0){
                // get folder from which a Url should created
                let folder 
                if(nextcloud_subfolder_path){
                    folder = await client.getFolder(nextcloud_subfolder_path);
                }else{
                    folder = userFolder
                }

                let share = await client.createShare({fileSystemElement: folder})
                if(nextcloud_subfolder_path){
                    shareURL = share.url + "?path=%2F" + name
                }else{
                    shareURL = share.url
                }
                
                /// check the URL
                if(typeof shareURL == "string"){
                    // The Url needs to have an https
                    let splitShareURL = shareURL.split(":")
                    if(splitShareURL[0] != "https"){
                        shareURL = "https:" + splitShareURL[1]
                    }
                }

                await userFolder.addComment(shareURL)
            }else{
                shareURL = comment[0]
            }
            console.log(shareURL)

            /// check the URL
            if(typeof shareURL == "string"){
                // The Url needs to have an https
                let splitShareURL = shareURL.split(":")
                if(splitShareURL[0] != "https"){
                    shareURL = "https:" + splitShareURL[1]
                }
            }
            
            /// Send the Share Link to the User 
            res.send({url: shareURL})
        }catch(e){
            console.log(e);
            res.statusCode = 500;
        }
    },
    
    // Experimentelle Funktionen (nicht im Frontend Implementiert)
    async speechtotext(req, res){
        try{
            // Informationen für den Path werden gesammelt und verarbeitet.
            const userId = jwt_decode(req.headers.authorization.replace("Bearer ","")).sub;
            const audionamearray = url.format({ pathname: req.originalUrl }).split('/');
            const audioname = decodeURI(audionamearray[audionamearray.length -1])//decodeURI wandelt %C3%9C in ü um
            // Path wird erstellt
            var pathaudio = '././audio-files/' + userId + "/" + audioname;

            // existiert Verzeichniss?
            await fs.exists(pathaudio, async (exist) => {
                if(!exist) {
                    // Error wenn Datei nicht existiert
                    res.statusCode = 404;
                    res.end("Datei nicht gefunden!: " + audioname );
                    return;
                }
                
                await fs.readFile(pathaudio, async (err, file) => {
                    if(err){
                        res.statusCode = 500;
                        res.end(`Error beim versuch die Datei zu bekommen: ` + err);
                    }else{
                        // Der Schlüssel für Dialogflow
                        const  config = {
                        }
                        // Instantiates a session client
                        const sessionClient = new dialogflow.SessionsClient(config);
                        // sessionId: String representing a random number or hashed user identifier
                        const sessionId = '123456';
                        // projectId: ID of the GCP project where Dialogflow agent is deployed
                        const projectId = 'gaertnergruenerdaumen-ahbi';
                        // languageCode: Indicates the language Dialogflow agent should use to detect intents
                        const languageCode = 'de';
                        // The path to identify the agent that owns the created intent.
                        const sessionPath = sessionClient.projectAgentSessionPath(
                            projectId,
                            sessionId
                        );
                    
                        // Request wird erstellt und nach Dialogflow gesendet
                        const request = {
                            session: sessionPath,
                            queryInput: {
                                audioConfig: {
                                    languageCode: languageCode,
                                }
                            },
                            inputAudio: file
                        };

                        // request wird nach Dialogflow gesendet
                        const responses = await sessionClient.detectIntent(request);

                        // Response wird zum frontend gesendet
                        res.send([responses[0].queryResult.queryText])
                    }
                });
            });
        }catch(e){
            console.log(e.name + ": " + e.message);
        }
    },
    async upload_json(req, res){
        try{
            // Informationen für den Path werden gesammelt und verarbeitet.
            const userId = jwt_decode(req.headers.authorization.replace("Bearer ","")).sub;
            const audioname = decodeURI(req.body.jsonname)//decodeURI wandelt %C3%9C in ü um

            // Name der JSON Datei erstellen
            let splitname = audioname.split(".")
            splitname.pop()
            var jsonname = splitname.join(".") + ".json"

            // Path wird erstellt
            var jsonpath = '././audio-files/' + userId + "/" + jsonname;
            
            fs.exists(jsonpath, function (exist) {
                if(exist) {
                    //Daten werden aus JSON rausgehollt
                    let rawdata = fs.readFileSync(jsonpath);
                    let json = JSON.parse(rawdata);

                    //Die alten Daten werden überschrieben
                    for(let data in req.body.data){
                        json[data] = req.body.data[data]
                    }

                    //Die alte JSON wird von der neue JSON überschieben 
                    let data = JSON.stringify(json);
                    fs.writeFileSync(jsonpath, data);
                    
                    res.send(["JSON wurde geupdatet"])
                }else{
                    // Daten werden aus dem req.body rausgehollt und in ein JSON gespeichert
                    var json = {}
                    for(let data in req.body.data){
                        json[data] = req.body.data[data];
                    }
                    
                    // Die JSON Datei wird erstellt
                    let data = JSON.stringify(json);
                    fs.writeFileSync(jsonpath, data);

                    // Überprüft ob die Datei erstellt wurde
                    fs.exists(jsonpath, function (exist){
                        if(exist){
                            // Bestätigung wird zum Frontend gesendet
                            res.send(["JSON wurde erstellt und gespeichert"])
                        }else{
                            res.statusCode = 500;
                            res.end(`Unerwarteter Error: Die JSON Datei wurde nicht erstellt`);
                        }
                    })
                }
            });
        }catch(e){
            console.log(e.name + ": " + e.message);
            res.statusCode = 500;
            res.end(`Unerwarteter Error: ${e}.`);
        }
    },
}

module.exports = UploadController;
