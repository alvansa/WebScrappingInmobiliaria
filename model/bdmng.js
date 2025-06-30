const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const os = require("os");
const caso = require('../componentes/caso/caso');

const BDPath = path.join(os.homedir(),"Documents","infoRemates/BD/Inmobiliaria-casos.db");
const BD_FK = path.join(os.homedir(),"Documents","infoRemates/BD/BD-FK.db");
if(!fs.existsSync(BDPath)){
    fs.mkdirSync(path.dirname(BD_FK), { recursive: true });
    const db = new Database(BD_FK);
    createDB(db);
    exports.db = db;
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
    CREATE TABLE IF NOT EXISTS Causa (
        causa TEXT,
        FOREIGN KEY (idJuzgado) REFERENCES Juzgado(id),
        ano INTEGER,
        FOREIGN KEY (idComuna) REFERENCES Comuna(id),
        fechaRemate TEXT,
        horaRemate TEXT,
        tipoParticipacion TEXT,
        minimoPostura INTEGER,
        minimoParticipacion INTEGER,
        FOREIGN KEY (idTipoPropiedad) REFERENCES TipoPropiedad(id),
        direccion TEXT,
        rolManzana INTEGER,
        rolPredio INTEGER,
        partes TEXT,
        avaluoFiscal INTEGER,
        FOREIGN KEY (idEstado) REFERENCES Estado(id),
        montoCompra INTEGER,
        FOREIGN KEY (idSeguimiento) REFERENCES Seguimiento(id),
        FOREIGN KEY (idEstadoRemate) REFERENCES EstadoRemate(id),
        FOREIGN KEY (idDeudaCausa) REFERENCES IDDeudaCausa(idCausa),
        precioVenta INTEGER,
        porcetajeIda INTEGER,
        maximoPostura INTEGER,

        PRIMARY KEY (causa, idJuzgado)
    )`;
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