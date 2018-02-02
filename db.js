const pg = require('pg');
const { hash, compare } = require('bcrypt');

const config = {
    user: 'postgres',
    database: 'SHOP',
    password: 'khoapham',
    host: 'localhost',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000,
};

const pool = new pg.Pool(config);

function queryDB(sql, cb) {
    pool.connect((err, client, done) => {
        if (err) return cb(err, undefined);
        client.query(sql, (errQuery, result) => {
            done(errQuery);
            if (errQuery) return cb(errQuery, undefined);
            cb(undefined, result);
        });
    });
}

const getArrProductType = (cb) => {
    const sql = 'SELECT * FROM "ProductType"';
    queryDB(sql, (err, result) => {
        if (err) return cb(err);
        cb(undefined, result.rows);
    });
};

const getTopProduct = (cb) => {
    const sql = `SELECT "Product".*, json_agg("Image".filename) as images FROM "Product"
    INNER JOIN "Image"
    ON "Product".id = "Image"."idProduct"
    WHERE "Product"."inTop" = true
    GROUP BY "Product".id
    ORDER BY "Product".id ASC`;
    queryDB(sql, (err, result) => {
        if (err) return cb(err);
        cb(undefined, result.rows);
    });
};

// getTopProduct((err, products) => console.log(products));

const signUp = (email, password, name, cb) => {
    hash(password, 8, (err, encypted) => {
        if (err) return cb(err);
        const sql = `INSERT INTO public."User"(email, password, name)
        VALUES ('${email}', '${encypted}', '${name}');`;
        queryDB(sql, (errQuery) => {
            if (errQuery) return cb(errQuery);
            cb();
        });
    });
};

const signIn = (email, password, cb) => {
    const sql = `SELECT * FROM "User" WHERE email = '${email}'`;
    queryDB(sql, (err, result) => {
        if (err) return cb(err);
        if (result.rows.length === 0) return cb(new Error('Email khong ton tai!'));
        const encypted = result.rows[0].password;
        compare(password, encypted, (errCompare, same) => {
            if (errCompare) return cb(errCompare);
            if (!same) return cb(new Error('Sai password'));
            const { phone, address, name } = result.rows[0]; 
            cb(undefined, { email, phone, address, name });
        });
    });
};

const getUserInfo = (email, cb) => {
    const sql = `SELECT * FROM "User" WHERE email = '${email}'`;
    queryDB(sql, (err, result) => {
        if (err) return cb(err);
        const { address, phone, name } = result.rows[0];
        cb(undefined, { email, address, phone, name });
    });
};

const getProductByIdType = (idType, idMax, cb) => {
    const sql = `SELECT "Product".*, json_agg("Image".filename) as images FROM "Product"
    INNER JOIN "Image"
    ON "Product".id = "Image"."idProduct"
    WHERE "Product"."idType" = ${idType} AND "Product".id > ${idMax} 
    GROUP BY "Product".id
    ORDER BY "Product".id ASC LIMIT 3`;
    queryDB(sql, (err, result) => {
        if (err) return cb(err);
        cb(undefined, result.rows);
    });
};

const changeInfo = (email, phone, address, name, cb) => {
    const sql = `UPDATE public."User"
	SET name='${name}', phone='${phone}', address='${address}'
	WHERE email='${email}';`;
    queryDB(sql, (err) => {
        if (err) return cb(err);
        cb(undefined);
    });
};

const getClient = () => (
    new Promise((resolve, reject) => {
        pool.connect((err, client, done) => {
            if (err) return reject(err);
            resolve({ client, done });
        });
    })
);

const query = (client, sql) => (
    new Promise((resolve, reject) => {
        client.query(sql, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    })
);

const insertCart = async (email, arrayCart) => {
    let doneFunction;
    try {
        const createBillSQL = `INSERT INTO public."Bill"("emailUser", date, status)
	        VALUES ('${email}', NOW(), false) RETURNING id;`;
        const { client, done } = await getClient();
        doneFunction = done;
        const billId = (await query(client, createBillSQL)).rows[0].id;
        const arraySQL = arrayCart.map(e => `INSERT INTO public."BillDetail"("idBill", "idProduct", quantity)
	        VALUES (${billId}, ${e.idProduct}, ${e.quantity})`);
        const bigSQL = arraySQL.join(';\n');
        await query(client, bigSQL);
        const updateTotalSQL = `UPDATE "Bill" SET total = (
            SELECT SUM("Product"."price" * "BillDetail".quantity) FROM "BillDetail"
            INNER JOIN "Product"
            ON "Product".id = "BillDetail"."idProduct"
            WHERE "BillDetail"."idBill" = ${billId}
            )
            WHERE "id" = ${billId}`;
        await query(client, updateTotalSQL);
        done();
        return true;
    } catch (e) {
        console.log(e);
        if (doneFunction) doneFunction();
        return false;
    }
};

module.exports = { 
    getArrProductType, 
    signIn, 
    signUp, 
    getUserInfo, 
    getTopProduct, 
    getProductByIdType, 
    changeInfo, 
    insertCart 
};
