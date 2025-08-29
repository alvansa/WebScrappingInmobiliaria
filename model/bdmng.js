const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const os = require("os");
const caso = require('../componentes/caso/caso');

// const BDPath = path.join(os.homedir(),"Documents","infoRemates/BD/Inmobiliaria-casos.db");

const BD_FK = path.join(os.homedir(),"Documents","infoRemates/BD/BD-FK.db");
const dir = path.join(os.homedir(),"Documents","infoRemates/BD/BD-FK.db");
if(!fs.existsSync(BD_FK)){
    exports.db = null
    // fs.mkdirSync(path.dirname(BD_FK), { recursive: true });
    // const db = new Database(BD_FK);
    // createDB(db);
    // exports.db = db;
}else{
    const db = new Database(BD_FK);
    exports.db = db;
}

function createDB(db){

    // create Corte table
    const createCorteTable = `
    CREATE TABLE IF NOT EXISTS Corte (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        numero INTEGER NOT NULL
    )`;
    db.prepare(createCorteTable).run();

    // create Juzgado table
    const createJuzgadoTable = `
    CREATE TABLE IF NOT EXISTS Juzgado (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        numero INTEGER NOT NULL,
        FOREIGN KEY (idCorte) REFERENCES Corte(id)
    )`;
    db.prepare(createJuzgadoTable).run();

    // create Causa table
    const queryCreateCausa = `
    CREATE TABLE "Causa" (
	"id"	INTEGER NOT NULL,
	"causa"	TEXT NOT NULL,
	"idJuzgado"	INTEGER NOT NULL,
	"ano"	INTEGER,
	"idComuna"	INTEGER,
	"fechaRemate"	TEXT,
	"horaRemate"	TEXT,
	"tipoParticipacion"	TEXT,
	"minimoPostura"	INTEGER,
	"minimoParticipacion"	INTEGER,
	"direccion"	TEXT,
	"rolManzana"	INTEGER,
	"rolPredio"	INTEGER,
	"partes"	TEXT,
	"avaluoFiscal"	INTEGER,
	"idEstado"	INTEGER,
	"montoCompra"	INTEGER,
	"idSeguimiento"	INTEGER,
	"idEstadoRemate"	INTEGER,
	"precioVenta"	INTEGER,
	"porcentajeIda"	INTEGER,
	"maximoPostura"	INTEGER,
	"idOrigen"	INTEGER,
	UNIQUE("causa","idJuzgado"),
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("idComuna") REFERENCES "Comuna"("id"),
	FOREIGN KEY("idEstado") REFERENCES "EstadoRemate"("id"),
	FOREIGN KEY("idEstadoRemate") REFERENCES "EstadoRemate"("id"),
	FOREIGN KEY("idJuzgado") REFERENCES "Juzgado"("numero"),
	FOREIGN KEY("idOrigen") REFERENCES "",
	FOREIGN KEY("idSeguimiento") REFERENCES "EstadoSeguimiento"("id")
);`;
    db.prepare(queryCreateCausa).run();
}

function createDBOriginal(db){
    const query = `
    CREATE TABLE IF NOT EXISTS Causa (
        causa TEXT,
        juzgado TEXT,
        fecha TEXT,
        PRIMARY KEY (causa, juzgado)
    )`;
    db.prepare(query).run();
}

function testDBSimple(dbFK){
    const query = `SELECT * FROM Comuna ;`;
    const result = dbFK.prepare(query).all();
    // console.log(result);

}



// function main(){
//     const dbFK = new Database(BD_FK);
//     testDBSimple(dbFK);
//     const comunas = obtainComunasFromDB(dbFK);
//     console.log(comunas.get('iquique'));
//     const casoTest = caso.createMockCase();
//     insertCase(dbFK, casoTest,comunas);
// }

// main();