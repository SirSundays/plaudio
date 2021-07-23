const express = require('express');
const router = express.Router();

const UploadController = require('./controllers/upload.controller');
const authController = require('./controllers/auth.controller');

// Um den Blob zu erhalten
const multer  = require('multer')
const getblob = multer()

module.exports = function (app, keycloak) {	
	// upload Audio Files to NextCloud; get Folder with Audio Files; get one Audio File with Content
	router.post('/nextcloud/hochladen', authController.checkIfAuthenticated, getblob.fields([{ name: 'blobToNextCloud'}]), UploadController.uploadToNextCloud);
	router.get('/nextcloud/getfolder', authController.checkIfAuthenticated, UploadController.listOfNextCloudFolder);
	router.get('/nextcloud/file/:audioname', authController.checkIfAuthenticated, UploadController.getOneAudioFromNextCloud);
	router.get('/nextcloud/url', authController.checkIfAuthenticated, UploadController.getNextCloudUrl);

	// Experimental functions
	router.get('/audio/speechtotext/:audioname', authController.checkIfAuthenticated, UploadController.speechtotext);
	router.post('/json/hochladen', authController.checkIfAuthenticated, UploadController.upload_json);

	// Auth
	router.post('/login', authController.login);
	router.get('/verify', authController.verifyToken)
	
	app.use('/api/pre', router);
};