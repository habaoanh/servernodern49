const express = require('express');
const jsonParser = require('body-parser').json();
const { 
    getArrProductType, 
    signIn, 
    signUp, 
    getUserInfo, 
    getTopProduct, 
    getProductByIdType, 
    changeInfo, 
    insertCart 
} = require('./db');
const { getEmailFromToken, getTokenFromEmail } = require('./jwt');

const app = express();

app.use(express.static('public'));

app.get('/init', (req, res) => {
    getArrProductType((err, arrProductType) => {
        if (err) return res.send(err);
        res.send(arrProductType);
    });
});

app.get('/initTopProduct', (req, res) => {
    getTopProduct((err, arrTopProduct) => {
        if (err) return res.send(err);
        res.send(arrTopProduct);
    });
});

app.post('/dangky', jsonParser, (req, res) => {
    const { name, password, email } = req.body;
    signUp(email, password, name, err => {
        if (err) return res.send('THAT_BAI');
        res.send('THANH_CONG');
    });
});

app.post('/dangnhap', jsonParser, (req, res) => {
    const { password, email } = req.body;
    signIn(email, password, (err, user) => {
        if (err) return res.send({ error: 'LOI DANG NHAP' });
        getTokenFromEmail(email, (errToken, token) => {
            res.send({ token, user });
        });
    });
});

app.post('/check', jsonParser, (req, res) => {
    const { token } = req.body;
    getEmailFromToken(token, (err, email) => {
        if (err) return res.send({ error: 'LOI Token' });
        getUserInfo(email, (errQuery, user) => {
            if (errQuery) return res.send({ error: 'LOI email' });
            res.send(user);
        });
    });
});

app.get('/productByCategory/:idType/:idMax', (req, res) => {
    const { idType, idMax } = req.params;
    getProductByIdType(idType, idMax, (err, products) => {
        if (err) res.send(err);
        res.send(products);
    });
});

app.post('/changeInfo', jsonParser, (req, res) => {
    const { token, name, address, phone } = req.body;
    getEmailFromToken(token, (err, email) => {
        if (err) return res.send(err.toString());
        changeInfo(email, phone, address, name, errDB => {
            if (errDB) return res.send(errDB.toString());
            res.send('THANH_CONG');
        });
    });
});

app.post('/newCart', jsonParser, (req, res) => {
    const { token, arrayCart } = req.body;
    getEmailFromToken(token, (err, email) => {
        console.log(email, arrayCart);
        insertCart(email, arrayCart)
        .then(isComplete => res.send(isComplete));
    });
});

app.listen(3000, () => console.log('Server started'));
