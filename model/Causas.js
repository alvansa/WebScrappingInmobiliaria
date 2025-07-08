const dbmgr = require("./bdmng");
const {obtainCorteJuzgadoNumbers} = require('../utils/corteJuzgado');

const EstadoPropiedad = {"bien familiar" : 1,"derecho": 2, "nuda propiedad" : 3, "usufructo": 4};

class Causas {
    constructor() {
        this.db = dbmgr.db;
    }
    getAllCausas() {
        const query = `SELECT Ca.*,
                        Ju.nombre AS nombre_juzgado,
                        Co.nombre AS nombre_comuna,
						Ori.tipo AS  tipo_origen,
						Est.nombre AS estado_remate,
						EstCiv.nombre AS estado_civil,
						EstCiv.tipo AS tipo_estado
                        FROM Causa AS Ca
                        INNER JOIN Juzgado AS Ju ON Ca.idJuzgado = Ju.numero
						INNER JOIN Origen AS Ori ON Ca.idOrigen = Ori.id
                        LEFT JOIN Comuna AS Co ON Ca.idComuna = Co.id
						LEFT JOIN EstadoPropiedad AS Est ON Ca.idEstado = Est.id
						LEFT JOIN EstadoCivil AS EstCiv ON Ca.idEstadoCivil = EstCiv.id`;
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
                        Co.nombre AS nombre_comuna,
						Ori.tipo AS  tipo_origen,
						Est.nombre AS estado_remate,
						EstCiv.nombre AS estado_civil,
						EstCiv.tipo AS tipo_estado
                        FROM Causa AS Ca
                        INNER JOIN Juzgado AS Ju ON Ca.idJuzgado = Ju.numero
						INNER JOIN Origen AS Ori ON Ca.idOrigen = Ori.id
                        LEFT JOIN Comuna AS Co ON Ca.idComuna = Co.id
						LEFT JOIN EstadoPropiedad AS Est ON Ca.idEstado = Est.id
						LEFT JOIN EstadoCivil AS EstCiv ON Ca.idEstadoCivil = EstCiv.id
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
                        Co.nombre AS nombre_comuna,
						Ori.tipo AS  tipo_origen,
						Est.nombre AS estado_remate,
						EstCiv.nombre AS estado_civil,
						EstCiv.tipo AS tipo_estado
                        FROM Causa AS Ca
                        INNER JOIN Juzgado AS Ju ON Ca.idJuzgado = Ju.numero
						INNER JOIN Origen AS Ori ON Ca.idOrigen = Ori.id
                        LEFT JOIN Comuna AS Co ON Ca.idComuna = Co.id
						LEFT JOIN EstadoPropiedad AS Est ON Ca.idEstado = Est.id
						LEFT JOIN EstadoCivil AS EstCiv ON Ca.idEstadoCivil = EstCiv.id
                        WHERE Ca.causa = ? AND Ca.idJuzgado = ?`;
            const causas = this.db.prepare(query).all(causa,numJuzgado);
            return causas.length > 0 ? causas[0] : null;
        }catch(error){
            return null;

        }
    }

    insertMultipleCases(remates,comunas){
        const cases = [];
        for(let remate of remates){
            cases.push(remate[1]);
        }
        obtainCorteJuzgadoNumbers(cases);
        for (const caso of cases) {
            try {
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

    searchByCausa(causa) {
        const query = "Select * from Causa WHERE causa = ?;";
        const causas = this.db.prepare(query).all(causa);
        return causas;
    }

    //Esta funcion revise el caso como objeto Caso no como la transformacion para mostrar
    insertCase(caso, comunas) {
        const minimoPostura = caso.montoMinimo?.monto ?? null;
        const montoCompra = caso.montoCompra?.monto ?? null;

        // Get comuna ID safely
        const idComuna = comunas.get(caso.comuna) ?? null;

        //Obtener numero de tipo derecho
        const idEstado = EstadoPropiedad[caso.tipoDerecho] ?? null;
        const idEstadoCivil = this.obtainEstadoCivil(caso.estadoCivil);
    

        // Use parameterized query to prevent SQL injection
        const query = `
            INSERT OR IGNORE INTO Causa (
                causa, idJuzgado, fechaRemate, ano, idComuna, 
                tipoParticipacion, minimoPostura, direccion, 
                rol, partes, avaluoFiscal, montoCompra,
                idOrigen, idEstado, idEstadoCivil
            ) VALUES (
                @causa, @numeroJuzgado, @fechaRemate, @anno, @idComuna,
                @formatoEntrega, @minimoPostura, @direccion,
                @rol, @partes, @avaluoPropiedad, @montoCompra,
                @idOrigen, @idEstado, @idEstadoCivil
            )`;

        const params = {
            causa: caso.causa,
            numeroJuzgado: caso.numeroJuzgado,
            fechaRemate: caso.fechaRemateSQL,
            anno: caso.anno,
            idComuna: idComuna,
            formatoEntrega: caso.formatoEntrega,
            minimoPostura: minimoPostura,
            direccion: caso.unitDireccion,
            rol: caso.unitRol,
            partes: caso.partes,
            avaluoPropiedad: caso.unitAvaluo,
            montoCompra: montoCompra,
            idOrigen: caso.origen,
            idEstado : idEstado,
            idEstadoCivil: idEstadoCivil
        };
        const stmt = this.db.prepare(query);

        try {
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
        return comunas;
    }

    obtainEstadoCivil(estado){
        if(!estado){
            return null;
        }
        if(estado.includes("soltero")){
            return 1;
        }else if(estado.includes('viudo')){
            return 2;
        }else if(estado.includes('conviviente')){
            return 3;
        }else if(estado.includes('separado')){
            return 4;
        }else if(estado.includes('sociedad')){
            return 6;
        }else if(estado.includes('separacion')){
            return 7;
        }else if(estado.includes('participacion')){
            return 8;
        }else if(estado.includes('articulo')){
            return 9;
        }else if(estado.includes('casado')){
            return 5;
        }else{
            return null;
        }
    }
}
module.exports = Causas;



/* Insert Basico causa
INSERT INTO Causa (
    causa,
    idJuzgado,
    ano,
    idComuna,
    fechaRemate,
    horaRemate,
    tipoParticipacion,
    minimoPostura,
    minimoParticipacion,
    direccion,
    rol,
    partes,
    avaluoFiscal,
    idEstado,
    montoCompra,
    precioVenta,
    porcentajeIda,
    maximoPostura,
    idOrigen,
    idEstadoCivil,
    isPaid
) VALUES (
    'C-746-2024',                     -- causa (ejemplo)
    9,                                  -- idJuzgado (debe existir en tabla Juzgado)
    2023,                               -- ano
    115,                                -- idComuna (debe existir en tabla Comuna)
    '2023-12-15',                       -- fechaRemate
    '09:30',                            -- horaRemate
    'vale vista',                          -- tipoParticipacion
    5000000,                            -- minimoPostura (ejemplo: $5.000.000)
    1000000,                            -- minimoParticipacion (ejemplo: $1.000.000)
    'Calle Principal 123, Santiago',    -- direccion
    '1342-209-220',                                -- rol
    'Demandante: Banco X; Demandado: Juan Pérez', -- partes
    7500000,                            -- avaluoFiscal (ejemplo: $7.500.000)
    1,                                  -- idEstado (debe existir en tabla Estado)
    6000000,                            -- montoCompra (ejemplo: $6.000.000)
    6200000,                            -- precioVenta (ejemplo: $6.200.000)
    70,                                 -- porcetajeIda (ejemplo: 70%)
    5500000,                             -- maximoPostura (ejemplo: $5.500.000)
    2,                             -- idOrigen 
   6,                                --  idEstadoCivil
 "Wed Dec 25 2024 00:00:00 GMT-0300 (Chile Summer Time)"    -- isPaid
);
*/