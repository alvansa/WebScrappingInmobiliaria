const dbmgr = require("./bdmng");

const db = dbmgr.db;
function getCausas() {
  const query = "Select * from Causa;";
  const causas = db.prepare(query).all();
  return causas;
}
function getTables(){
    const query = "SELECT name FROM sqlite_master WHERE type='table';";
    const tables = db.prepare(query).all();
    return tables;
}

function createDB(){
    const query = `
    CREATE TABLE IF NOT EXISTS Causa (
        causa TEXT,
        juzgado TEXT,
        PRIMARY KEY (causa, juzgado)
    )`;
    db.prepare(query).run();
}
function insertCaso(casos){
    const query = "INSERT OR IGNORE INTO Causa (causa, juzgado) VALUES (?, ?)";
    const stmt = db.prepare(query);
    for(const caso of casos){
        try{
            stmt.run(caso.causa,caso.juzgado);
        }catch(error){
            console.error("Error al insertar caso: ",e);
        }
    }
}
function DeleteAll(){
    const query = "DELETE FROM Causa;";
    db.prepare(query).run();
}
module.exports = { getCausas, getTables,createDB,insertCaso,DeleteAll };