const { sign, verify } = require('jsonwebtoken');

const KEY = 'kashbds932dBBT5272d//;s'

function getTokenFromEmail(email, cb) {
    sign({ email }, KEY, { expiresIn: '1d' }, (err, token) => {
        cb(err, token);
    });
}

function getEmailFromToken(token, cb) {
    verify(token, KEY, (err, obj) => {
        if (err) return cb(err);
        cb(undefined, obj.email);
    });
}

module.exports = { getTokenFromEmail, getEmailFromToken }
