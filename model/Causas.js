const dbmgr = require("./bdmng");

class Causas {
    constructor() {
        this.db = dbmgr.db;
    }
    getAllCausas() {
        const query = "Select * from Causa;";
        const causas = this.db.prepare(query).all();
        return causas;
    }
    getTables() {
        const query = "SELECT name FROM sqlite_master WHERE type='table';";
        const tables = this.db.prepare(query).all();
        return tables;
    }

    createDB() {
        const query = `
    CREATE TABLE IF NOT EXISTS Causa (
        causa TEXT,
        juzgado TEXT,
        fecha TEXT,
        PRIMARY KEY (causa, juzgado)
    )`;
        this.db.prepare(query).run();
    }
    insertCaso(casos) {
        const query = "INSERT OR IGNORE INTO Causa (causa, juzgado,fecha) VALUES (?, ?, ?)";
        const stmt = this.db.prepare(query);
        for (const caso of casos) {
            try {
                stmt.run(caso.causa, caso.juzgado, caso.fecha);
            } catch (error) {
                console.error("Error al insertar caso: ", e);
            }
        }
    }
    DeleteAll() {
        const query = "DELETE FROM Causa;";
        this.db.prepare(query).run();
    }
    DropCausa() {
        const query = "DROP TABLE Causa;";
        this.db.prepare(query).run();
    }

    getCausas(fechalimite) {
        const query = "Select * from Causa WHERE fecha < ?;";
        const causas = this.db.prepare(query).all(fechalimite);
        return causas;
    }
    searchByCausa(causa) {
        const query = "Select * from Causa WHERE causa = ?;";
        const causas = this.db.prepare(query).all(causa);
        return causas;
    }
}
module.exports = Causas;