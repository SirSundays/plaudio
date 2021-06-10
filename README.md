# README #

### What is Plaudio? ###
Plaudio is a little PWA which is developed for the project [Gardeners Green Thumb](https://www.deutschland-nederland.eu/project/gartners-gruner-daumen-2/). It should help gardeners document their work and make the data reachable for the scientist in the project.

With Plaudio the gardeners can use their phones to record audio locally and then upload it later to a provided Nextcloud.

### How do I get set up for production? ###

* ### Step 1: Docker-Desktop ###
    
    Download and install Docker(-Desktop): https://www.docker.com/products/docker-desktop

* ### Step 2: Generate Private and Public Keys ###

    For this you can use a website like this: https://travistidwell.com/jsencrypt/demo/
    
* ### Step 3: Using the keys ###

    Copy the private key into a file called "private.key" inside of the "docker" folder.

    Copy the public key into a file called "public.key" inside of the "docker" folder. Also paste it into the "pubKey"-variable inside the "environment.prod.ts" which is inside the "client/src/environments" folder.

* ### Step 4: Update the server url ###

    In the aformentioned "environment.prod.ts", fill in the url of the server which can be reached by the frontend (something like "http://localhost" or "https://example.com").

* ### Step 5: Build the client ###

    Execute "ng build --prod" inside the client folder.

* ### Step 6: Update docker-compose ###

    Fill in the nextcloud related user and server information.

* ### Step 7: Run docker-compose ###

    Execute "docker-compose up --build" inside the "docker" folder. You should be up and running now.
    There are two test users. One of which is the user "test" with the password "test".

### How to manage users? ###

* ### Step 1: Shell ###

    Open a shell inside the docker folder.

* ### Step 2: Go into the container ###

    Execute "docker-compose exec api /bin/bash".
    You now have a bash shell inside of the container.

* ### Step 3: Manage users ###

    Execute "node registerUsers.js".
    Follow the steps on the screen.

* ### Step 4: Exit the Shell ###

    Execute "exit".

### How do I get set up for development? ###

    Coming soon.

### Contributers ###

[Dmitrij Poberej](https://github.com/Dmitrij-P)
* Base features
* Audio Recording
* Audio Management
* Connection to NextCloud
* Offline Function

[Jan Sonntag](https://github.com/SirSundays)
* User Authentication
* User Management
* Client offline Verification
* UI improvements
* Translations

### Disclaimer ###

This project may include some private RSA keys or passwords that where used for development. These are just for testing and will not be used in production.
