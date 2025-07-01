const dbmgr = require("./bdmng");
const {obtainCorteJuzgadoNumbers} = require('../utils/corteJuzgado');

class Causas {
    constructor() {
        this.db = dbmgr.db;
    }
    getAllCausas() {
        const query = `SELECT Ca.*,
                        Ju.nombre AS nombre_juzgado,
                        Co.nombre AS nombre_comuna
                        FROM Causa AS Ca
                        INNER JOIN Juzgado AS Ju ON Ca.idJuzgado = Ju.numero
                        LEFT JOIN Comuna AS Co ON Ca.idComuna = Co.id`;
        const causas = this.db.prepare(query).all();
        return causas;
    }
    getTables() {
        const query = "SELECT name FROM sqlite_master WHERE type='table';";
        const tables = this.db.prepare(query).all();
        return tables;
    }

    getByCausa(causa) {
        try{
            const query = `SELECT Ca.*,
                        Ju.nombre AS nombre_juzgado,
                        Co.nombre AS nombre_comuna
                        FROM Causa AS Ca
                        INNER JOIN Juzgado AS Ju ON Ca.idJuzgado = Ju.numero
                        LEFT JOIN Comuna AS Co ON Ca.idComuna = Co.id
                        WHERE Ca.causa = ?`;
            const causas = this.db.prepare(query).all(causa);
            return causas.length > 0 ? causas : null;
        }catch(error){
            return null;

        }
    }
    searchCausa(causa,numJuzgado) {
        try{
            const query = `SELECT Ca.*,
                        Ju.nombre AS nombre_juzgado,
                        Co.nombre AS nombre_comuna
                        FROM Causa AS Ca
                        INNER JOIN Juzgado AS Ju ON Ca.idJuzgado = Ju.numero
                        LEFT JOIN Comuna AS Co ON Ca.idComuna = Co.id
                        WHERE Ca.causa = ? AND Ca.idJuzgado = ?`;
            const causas = this.db.prepare(query).all(causa,numJuzgado);
            return causas.length > 0 ? causas[0] : null;
        }catch(error){
            return null;

        }
    }


    // createDB() {
    //     const query = `
    // CREATE TABLE IF NOT EXISTS Causa (
    //     causa TEXT,
    //     juzgado TEXT,
    //     fecha TEXT,
    //     PRIMARY KEY (causa, juzgado)
    // )`;
    //     this.db.prepare(query).run();
    // }

    // insertCaso(casos) {
    //     const query = "INSERT OR IGNORE INTO Causa (causa, juzgado,fecha) VALUES (?, ?, ?)";
    //     const stmt = this.db.prepare(query);
    //     for (const caso of casos) {
    //         try {
    //             stmt.run(caso.causa, caso.juzgado, caso.fecha);
    //         } catch (error) {
    //             console.error("Error al insertar caso: ", e);
    //         }
    //     }
    // }
    insertMultipleCases(remates,comunas){
        const cases = [];
        for(let remate of remates){
            cases.push(remate[1]);
        }
        obtainCorteJuzgadoNumbers(cases);
        for (const caso of cases) {
            try {
                // console.log(`Caso ${caso}`);
                // console.log(`Caso[1] causa ${caso[1].causa}`)
                this.insertCase(caso,comunas);
            } catch (error) {
                console.error("Error al insertar caso: ", error);
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
    insertCase(caso, comunas) {
        // Handle potential null/undefined values
        
        const minimoPostura = caso.montoMinimo?.monto ?? null;
        const montoCompra = caso.montoCompra?.monto ?? null;

        const rolesPropiedad = caso.getRolPropiedad();
        let rolManzana = null;
        let rolPredio = null;

        if (rolesPropiedad && rolesPropiedad.length >= 2) {
            rolManzana = rolesPropiedad[0];
            rolPredio = rolesPropiedad[1];
        }


        // Get comuna ID safely
        const idComuna = comunas.get(caso.comuna) ?? null;

        // Use parameterized query to prevent SQL injection
        const query = `
        INSERT OR IGNORE INTO Causa (
            causa, idJuzgado, fechaRemate, ano, idComuna, 
            tipoParticipacion, minimoPostura, direccion, 
            rolManzana, rolPredio, partes, avaluoFiscal, montoCompra
        ) VALUES (
            @causa, @numeroJuzgado, @fechaRemate, @anno, @idComuna,
            @formatoEntrega, @minimoPostura, @direccion,
            @rolManzana, @rolPredio, @partes, @avaluoPropiedad, @montoCompra
        )
    `;

        const params = {
            causa: caso.causa,
            numeroJuzgado: caso.numeroJuzgado,
            fechaRemate: caso.fechaRemateSQL,
            anno: caso.anno,
            idComuna: idComuna,
            formatoEntrega: caso.formatoEntrega,
            minimoPostura: minimoPostura,
            direccion: caso.direccion,
            rolManzana: rolManzana,
            rolPredio: rolPredio,
            partes: caso.partes,
            avaluoPropiedad: caso.avaluoPropiedad,
            montoCompra: montoCompra
        };
        const stmt = this.db.prepare(query);

        try {
            console.log(`Caso a insertar ${params} con causa ${params.causa} ${params.numeroJuzgado}`);
            stmt.run(params);
        } catch (error) {
            console.error('Error inserting case:', error);
            throw error; // Re-throw or handle as appropriate
        }
    }

    obtainComunasFromDB() {
        const query = 'select * FROM Comuna';
        const comunasDB = this.db.prepare(query).all();
        let comunas = new Map();
        for (let comuna of comunasDB) {
            comunas.set(comuna.nombre.toLowerCase(), comuna.id);
        }
        console.log(comunas)
        return comunas;
    }
}
module.exports = Causas;