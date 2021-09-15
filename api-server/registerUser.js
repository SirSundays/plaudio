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

    readline.question("Choose action: create user(1), update password(2), delete user(3), list all users(4): ", number => {
        switch (number) {
            case "1":
                const createUser = (tmp_username,tmp_password, tmp_company)=>{
                    bcrypt.hash(tmp_password, 10, (err, hash) => {
                        if (err) {
                            console.log("Hash failed:", err);
                            process.exit();
                        }
                        users.push({
                            'username': tmp_username,
                            'password': hash,
                            'company': tmp_company
                        });
                        fs.writeFile('users.json', JSON.stringify(users), (err) => {
                            if (err) {
                                console.log("Saving failed:", err);
                                process.exit();
                            }
                            console.log("Done!");
                            process.exit();
                        });
                    });
                }

                readline.question("New Username: ", username => {
                    if (users.filter(user => user.username === username).length !== 0) {
                        console.log("User already exists. Abort.");
                        process.exit();
                    }
                    readline.question("Password: ", password => {
                        readline.question(`Do you want to create a user ${username} with the password ${password}? (y/n) `, accept => {
                            if (accept !== "y") {
                                process.exit();
                            }
                            
                            readline.question(`Do you want to add an Company to the user ${username}? (y/n) `, acceptAddCompany=>{
                                if (acceptAddCompany === "y") {
                                    readline.question("New Username: ", company => {
                                        readline.close();
                                        createUser(username, password, company)
                                    })
                                }else{
                                    readline.close();
                                    createUser(username, password, "")
                                }
                            })

                        });
                    });
                });
                break;
            case "2":
                readline.question("Which User should be updated: ", username => {
                    if (users.filter(user => user.username === username).length == '0') {
                        console.log("No user with this username. Abort.");
                        process.exit();
                    }
                    readline.question("New password: ", password => {
                        readline.question(`Do you want to update the user ${username} with the password ${password}? (y/n) `, accept => {
                            readline.close();
                            if (accept !== "y") {
                                process.exit();
                            }
                            bcrypt.hash(password, 10, (err, hash) => {
                                if (err) {
                                    console.log("Hash failed:", err);
                                    process.exit();
                                }
                                users[users.findIndex(user => user.username === username)] = {
                                    'username': username,
                                    'password': hash
                                };
                                fs.writeFile('users.json', JSON.stringify(users), (err) => {
                                    if (err) {
                                        console.log("Saving failed:", err);
                                        process.exit();
                                    }
                                    console.log("Done!");
                                    process.exit();
                                });
                            });
                        });
                    });
                });
                break;
            case "3":
                readline.question("Which User should be deleted: ", username => {
                    if (users.filter(user => user.username === username).length == '0') {
                        console.log("No user with this username. Abort.");
                        process.exit();
                    }
                    readline.question(`Do you want to delete the user ${username}? (y/n) `, accept => {
                        readline.close();
                        if (accept !== "y") {
                            process.exit();
                        }
                        users.splice(users.findIndex(user => user.username === username), 1);
                        fs.writeFile('users.json', JSON.stringify(users), (err) => {
                            if (err) {
                                console.log("Saving failed:", err);
                                process.exit();
                            }
                            console.log("Done!");
                            process.exit();
                        });
                    });
                });
                break;
            case "4":
                users.forEach((user, i) => {
                    console.log(`${i + 1}. ${user.username}`);
                });
                process.exit();
                break;
            default:
                console.log("Invalid input. Abort.");
                process.exit();
        }
    });

});