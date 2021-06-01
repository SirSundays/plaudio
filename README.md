# README #

Set up Project

### How do I get set up? ###

* ### Schritt 1: Docker-Desktop installieren ###
    
    Download Docker-Desktop: https://www.docker.com/products/docker-desktop

    Folge den Schritten um Docker Desktop (Hyper-V) zu installieren

    Starte Docker Desktop

    Öffne ein Terminmal, wechsel in das Verzeichnis ./docker der App und führen den Befehl docker-compose up aus

    Auf eventuelle Nachfrage von Windows drücke auf "Share It"

    Keyclock ist nun unter localhost:8080 erreichbar, phpMyAdmin unter:8081, eine MySQL Datenbank läuft auf Port 3306 und eine MongoDB auf 27017

* ### Schritt 2: Node-Module installieren ###

    Führe npm install im Root Verzeichnis, als auch in ./client aus

* ### Schritt 3: MongoDB Compass installieren ### 

    Download MongoDB Compass: https://www.mongodb.com/try/download/compass

    Folge den Schritten um MongoDB Compass zu installieren

    Öffne MongoDB Compass und Klicken auf Fill in connection fields individually:

    Hostname: localhost
    Port: 27017
    Authentication: Username/Password (admin/admin)

* ### Schritt 4: User in Keycloak anlegen ###

    Unter localhost:8080 links auf Admin Console klicken und dort mit admin admin anmelden

    Im Reiter links auf Useres klicken und dann rechts oben auf add User

    In disesem Screen einen Usernamen vergeben und die Email auf verified setzen, anschließend save drücken

    Danach unter dem Reiter Credentials ein Passwort vergeben und speichern
    
    Weiterhin muss dem User noch eine sogenannte Rolle gegeben werden. Klicke dazu auf den Reiter "Role Mappings".
    Zum testen sollte dem User am besten die Rolle "Configurator" zu geteilt werden. 
    Diese beinhaltet alle Rechte der dadrunter liegenden. Dazu die gewünschte Rolle auswählen und auf "Add selected" drücken. 

    Mit diesem Useraccount kann sich anschließend in der App angemeldet werden. 

    eventuell muss die neue realm Datei unter ./docker in Keycloak importiert werden

* ### Schritt 5: Modelle in das Backend laden ###

    Unter ./scripts befindet sich ein Script mit dem Namen create.js, mit diesem können dynamisch Backendmodelle und Routen aus xml Dateien erstellt werden

    Die dazugehörigen xml Dateien müssen unter ./scripts/objects bzw. ./scripts/massnahmen abgelget werden (Für Struktur siehe Beispieldateien)

    Das Script kann mit node create.js <objects/massnahmen> <objectName/Massnahmenname>.xml aufgerufen werden (Aufgrund eines Bugs können aktuell nicht mehrere Dateien hintereinander angelegt werden)

* ### Schritt 6: Backend starten ###

    Das Backend kann unter ./api-server über node app.js gestartet werden und läuft danach auf Port 5000
    
* ### Schritt 7: Client tests ###

    Das Frontend unter ./client basiert auf Angular und ist mit AngularMaterial designed 

    Mit ng-serve kann das Frontend im Development-Modus unter localhost:4200 bearbeitet werden
