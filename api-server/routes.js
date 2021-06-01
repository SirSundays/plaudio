const express = require('express');
const router = express.Router();

const UploadController = require('./controllers/upload.controller');

// Um den Blob zu erhalten
const multer  = require('multer')
const getblob = multer()

module.exports = function (app, keycloak) {

	// upload Audio File; get Folder with Audio Files; get one Audio File with Content
	router.post('/audio/hochladen',keycloak.protect("realm:visitor"), getblob.fields([{ name: 'blob'}]), UploadController.uploadAudio);
	router.get('/list_audios',keycloak.protect("realm:visitor"), UploadController.listallaudiosfromuser);
	router.get('/list_archiv',keycloak.protect("realm:visitor"), UploadController.listallaudiosfromuser);
	
	router.post('/getaudio/:audioname',keycloak.protect("realm:visitor"), UploadController.getoneaudio);
	router.post('/getaudiofromarchive/:audioname',keycloak.protect("realm:visitor"), UploadController.getoneaudio);

	router.delete('/audio/delete/:audioname',keycloak.protect("realm:visitor"), UploadController.deletefile);
	router.delete('/audio/deletefromarchive/:audioname',keycloak.protect("realm:visitor"), UploadController.deletefile);

	// upload Audio Files to NextCloud; get Folder with Audio Files; get one Audio File with Content
	router.post('/nextcloud/hochladen', keycloak.protect("realm:visitor"), getblob.fields([{ name: 'blobToNextCloud'}]), UploadController.uploadToNextCloud);
	router.get('/nextcloud/getfolder', keycloak.protect("realm:visitor"), UploadController.listOfNextCloudFolder);
	router.get('/nextcloud/file/:audioname', keycloak.protect("realm:visitor"), UploadController.getOneAudioFromNextCloud);
	
	// Experimental functions
	router.get('/audio/speechtotext/:audioname',keycloak.protect("realm:visitor"), UploadController.speechtotext);
	router.post('/json/hochladen',keycloak.protect("realm:visitor"), UploadController.upload_json);
	
	app.use('/api/pre', router);
};