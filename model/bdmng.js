const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const os = require("os");

const BDPath = path.join(os.homedir(),"Documents","infoRemates/BD/Inmobiliaria-casos.db");
if(!fs.existsSync(BDPath)){
    fs.mkdirSync(path.dirname(BDPath), { recursive: true });
    const db = new Database(BDPath);
    createDB(db);
    exports.db = db;
}else{
    const db = new Database(BDPath);
    exports.db = db;
}

function createDB(db){
    const query = `
    CREATE TABLE IF NOT EXISTS Causa (
        causa TEXT,
        juzgado TEXT,
        fecha TEXT,
        PRIMARY KEY (causa, juzgado)
    )`;
    db.prepare(query).run();
}