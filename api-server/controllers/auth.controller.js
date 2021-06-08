const fs = require('fs')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const RSA_PRIVATE_KEY = fs.readFileSync('./private.key');
const RSA_PUBLIC_KEY = fs.readFileSync('./public.key');

const users = JSON.parse(fs.readFileSync('./users.json'));

const authController = {
    async login(req, res) {
        const username = req.body.username;
        const password = req.body.password;

        let validation = await validateEmailAndPassword(username, password);
        if (validation) {
            const userId = username;
            const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
                algorithm: 'RS256',
                expiresIn: Date.now() + 31556952000,
                subject: userId
            });
            // set it in the HTTP Response body
            res.send({
                idToken: jwtBearerToken,
                expiresIn: 0
            });
        }
        else {
            // send status 401 Unauthorized
            res.status(401).send('Unauthorized');
        }
    },

    checkIfAuthenticated(req, res, next) {
        let token = req.headers.authorization.replace("Bearer ","");
        jwt.verify(token, RSA_PUBLIC_KEY, (err, dec) => {
            if (dec != undefined) {
                next();
            } else {
                res.status(401).send('Unauthorized');
            }
        });
    }
}

const validateEmailAndPassword = function (username, password) {
    return new Promise((resolve, reject) => {
        let userWname = users.filter(user => user.username === username);
        if (userWname.length === 0) {
            resolve(false);
        }
        bcrypt.compare(password, userWname[0].password, (err, result) => {
            if (err) {
                console.log("bcrypt err: ", err);
                resolve(false);
            }
            resolve(true);
        });
    });
}

module.exports = authController;