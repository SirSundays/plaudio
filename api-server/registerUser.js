const bcrypt = require('bcrypt');
const fs = require('fs');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

fs.readFile('./users.json', 'utf8', (err, json) => {
    if (err) {
        console.log("File read failed:", err);
        return;
    }
    
    let users = JSON.parse(json);
    readline.question("New Username: ", username => {
        if (users.filter(user => user.username === username).length !== 0) {
            console.log("User already exists. Abort.");
            process.exit();
        }
        readline.question("Password: ", password => {
            readline.question(`Do you want to create a user ${username} with the password ${password}? (y/n) `, accept => {
                readline.close();
                if (accept !== "y") {
                    process.exit();
                }
                bcrypt.hash(password, 10, (err, hash) => {
                    if (err) {
                        console.log("Hash failed:", err);
                        process.exit();
                    }
                    users.push({
                        'username': username,
                        'password': hash
                    });
                    fs.writeFile('users.json', JSON.stringify(users), (err) => {
                        if (err) {
                            console.log("Saving failed:", err);
                            process.exit();
                        }
                        console.log("Done!");
                        return;
                    });
                });
            });
        });
    });
});