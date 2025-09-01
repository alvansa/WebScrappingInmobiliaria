//Necesario si o si
const XLSX = require(`xlsx`);
const fs = require(`fs`);
const path = require(`path`);
const Causas = require(`../../model/Causas.js`);
const config = require("../../config.js");
const Caso = require(`../caso/caso.js`);
const {fixStringDate} = require(`../../utils/cleanStrings.js`);

const PJUD = config.PJUD;
const EMOL = config.EMOL;
const LIQUIDACIONES = config.LIQUIDACIONES;
const PREREMATES = config.PREREMATES;
// const config = config.LETRAS;

const RANGO_EXCEL = `${config.INICIO}5:${config.COMENTARIOS3}`;

class createExcel {
    constructor(saveFile, startDate, endDate, emptyMode, type, isTestMode = false) {
        this.saveFile = saveFile;
        this.startDate = startDate;
        this.endDate = endDate;
        this.emptyMode = emptyMode;
        this.type = type;
        this.fixedStartDate = new Date(fixStringDate(startDate));
        this.fixedEndDate = new Date(fixStringDate(endDate));
        this.causaDB = new Causas();
        this.comunas = this.causaDB.obtainComunasFromDB();
        this.isTestMode = isTestMode; // Indica si se está en modo desarrollo

    }

    crearBase() {
        // Crea una hoja de cálculo vacía
        const ws = {};

        ws[`${config.INICIO}5`] = { v: 'vacia', t: 's' };
        ws[`${config.ESTADO}5`] = { v: 'status', t: 's' };
        ws[`${config.FECHA_DESC}5`] = { v: 'F.Desc', t: 's' };
        ws[`${config.ORIGEN}5`] = { v: 'origen', t: 's' };
        ws[`${config.NOTAS}5`] = { v: 'notas', t: 's' };
        ws[`${config.FECHA_REM}5`] = { v: 'F. remate', t: 's' };
        ws[`${config.HORA_REMATE}5`] = { v: 'Hora', t: 's' };
        ws[`${config.OCUPACION}5`] = { v: 'Ocup', t: 's' };
        ws[`${config.MARTILLERO}5`] = { v: 'macal', t: 's' };
        ws[`${config.DIRECCION}5`] = { v: 'direccion', t: 's' };
        ws[`${config.CAUSA}5`] = { v: 'causa', t: 's' };
        ws[`${config.TRIBUNAL}5`] = { v: 'tribunal', t: 's' };
        ws[`${config.COMUNA_TRIBUNAL}5`] = { v: 'comuna tribunal', t: 's' };
        ws[`${config.COMUNA}5`] = { v: 'comuna propiedad', t: 's' };
        ws[`${config.ANNO}5`] = { v: 'año inscripcion', t: 's' };
        ws[`${config.PARTES}5`] = { v: 'partes', t: 's' };
        ws[`${config.DATO}5`] = { v: 'dato', t: 's' };
        ws[`${config.VV_O_CUPON}5`] = { v: 'vale vista o cupon', t: 's' };
        ws[`${config.PORCENTAJE}5`] = { v: '%', t: 's' };
        ws[`${config.PLAZOVV}5`] = { v: 'plazo vv', t: 's' };
        ws[`${config.CONTR_Y_ASEO}5`] = { v: 'contribu y aseo', t: 's' };
        ws[`${config.GGCC}5`] = { v: 'GGCC', t: 's' };
        ws[`${config.DEUDA2}5`] = { v: 'deuda 2', t: 's' };
        ws[`${config.DEUDA3}5`] = { v: 'deuda 3', t: 's' };
        ws[`${config.ROL}5`] = { v: 'rol', t: 's' };
        ws[`${config.NOTIFICACION}5`] = { v: 'notif', t: 's' };
        ws[`${config.PRECIO_MINIMO}5`] = { v: 'preciominimo', t: 's' };
        ws[`${config.PRECIO_MINIMO2}5`] = { v: 'UF o $', t: 's' };
        ws[`${config.AVALUO_FISCAL}5`] = { v: 'avaluo fiscal', t: 's' };
        ws[`${config.ESTADO_CIVIL}5`] = { v: 'estado civil', t: 's' };
        ws[`${config.PX_COMPRA}5`] = { v: 'Px $ compra ant', t: 's' };
        ws[`${config.ANNO_COMPRA}5`] = { v: 'año compr ant', t: 's' };
        ws[`${config.PRECIO_VENTA_NOS}5`] = { v: 'precio venta nos', t: 's' };
        ws[`${config.POSTURA_MAXIMA}5`] = { v: 'max', t: 's' };
        ws[`${config.PORCENTAJE_POSTURA}5`] = { v: '%', t: 's' };
        ws[`${config.UF_M}5`] = { v: 'UF/m2', t: 's' };


        ws[`${config.DEUDA_BANCO}5`] = { v: 'deuda bco', t: 's' };
        ws[`${config.DEUDA_HIPOTECA}5`] = { v: 'Deuda Hipotecaria', t: 's' };
        ws[`${config.DEUDA_PAGARE}5`] = { v: 'Deuda pagare', t: 's' };
        ws[`${config.DEUDA_TGR}5`] = { v: 'Deuda tgr', t: 's' };

        // Ajusta el ancho de las columnas
        createExcel.cambiarAnchoColumnas(ws);

        // Define el rango de la hoja para asegurar que incluya todas las celdas especificadas
        ws[`!ref`] = `${config.INICIO}5:${config.COMENTARIOS3}5`;

        // Crea un nuevo libro y agrega la hoja
        const wb = XLSX.utils.book_new();
        wb.Props = {
            Title: `Remates`,
            Subject: `Remates`
        };
        // Agrega la hoja al libro de trabajo
        XLSX.utils.book_append_sheet(wb, ws, `Remates`);
        // Guarda el archivo
        XLSX.writeFile(wb, path.join(this.saveFile, `Remates.xlsx`));
    }

    async writeData(casos, name = "") {
        console.log("=====================\nEscibiendo informacion en excel\n==============================");
        let filePath = path.join(this.saveFile, `Remates.xlsx`);
        // Revisa si el archivo base ya existe
        if (!fs.existsSync(path.join(this.saveFile, `Remates.xlsx`))) {
            this.crearBase(this.saveFile);
            console.log(`Archivo creado`);
        }
        // Lee el archivo base para poder insertar los datos
        const wb = XLSX.readFile(path.join(this.saveFile, `Remates.xlsx`));
        const ws = wb.Sheets[`Remates`];
        createExcel.cambiarAnchoColumnas(ws);

        try {
            if (this.type === "one") {
                const lastRow = this.fillWithOne(ws, casos);
                ws[`!ref`] = RANGO_EXCEL + lastRow;
                filePath = path.join(this.saveFile, `Caso_` + casos.causa + casos.juzgado + '.xlsx');
            } else if (this.type === "oneDay") {
                let lastRow = this.insertCasos(casos, ws) - 1;
                ws[`!ref`] = RANGO_EXCEL + lastRow;
                filePath = path.join(this.saveFile, name + `.xlsx`);
            } else {
                let lastRow = await this.insertarCasosExcel(casos, ws) - 1;
                ws[`!ref`] = RANGO_EXCEL + lastRow;
                const fechaInicioDMA = cambiarFormatoFecha(this.startDate);
                const fechaFinDMA = cambiarFormatoFecha(this.endDate);
                filePath = path.join(this.saveFile, `Remates_` + fechaInicioDMA + '_a_' + fechaFinDMA + '.xlsx');
            }
            XLSX.writeFile(wb, filePath, {cellDates: true});
            return filePath;
        } catch (error) {
            console.error(`Error al obtener resultados:`, error);
            return null;
        }

    }

    insertCasos(casos, ws) {
        let currentRow = 6;
        for (let caso of casos) {
            insertarCasoIntoWorksheet(caso.toObject(), ws, currentRow);
            currentRow = currentRow + 1;
        }
        return currentRow;
    }


    fillWithOne(ws, casos) {
        // Agregar la busqueda de casos en DB y union si existe ya en la DB
        const caseDB = this.isCaseInDB(casos);
        if(caseDB){
            casos = Caso.bindCaseWithDB(casos,caseDB);
        }
        this.causaDB.insertCase(casos,this.comunas); 
        const caso = casos.toObject();
        let currentRow = 6;
        insertarCasoIntoWorksheet(caso, ws, currentRow);
        currentRow = currentRow + 1;
        return currentRow
    }

    async insertarCasosExcel(casos, ws) {
        console.log("Fechas en el exccel: ",fixStringDate(this.startDate),fixStringDate(this.endDate),this.fixedStartDate, this.fixedEndDate)
        let remates = new Map();
        let currentRow = 6;

        if (!Array.isArray(casos) || casos.length === 0) {
            console.log("No se encontraron datos para insertar.");
            return;
        }
        console.log("Los casos recibidos son: ", casos.length);

        // Primero se leen todos los casos obtenidos y se verifican para agregarlos,
        // en caso de que ya hayan sido agregados se une la informacion 
        for(let caso of casos){
            if (caso.fechaPublicacion === "N/A" || caso.fechaPublicacion == null) {
                caso.fechaPublicacion = fechaMenosUno(this.endDate);
            }
            if(this.getValidAuctions(caso, remates) || this.isTestMode){
            // if(this.getValidAuctions(caso, remates)){
                this.addObjectToSet(remates,caso);
            }
        }
        console.log("Total de casos en remates: ", remates.size);

        // Se escriben todos los casos revisados en la hoja, para eso primero se transforman a
        // objetos para verificar la normalizacion
        for (let caso of remates) {
            console.log("Escribiendo caso :", caso[1].causa);
            const casoObj = caso[1].toObject()

            insertarCasoIntoWorksheet(casoObj, ws, currentRow);
            currentRow++;
        }
        // Agrega los remates a la base de datos
        if (!this.emptyMode) {
            this.causaDB.insertMultipleCases(remates,this.comunas);
        }
        return currentRow;
    }

    addObjectToSet(remates,caso){
        const key = `${caso.causa}|${caso.juzgado}`;
        if(!remates.has(key)){
            remates.set(key, caso);
        }
    }

    getValidAuctions(currentCase, cacheAuctions) {
        if (currentCase.juzgado) {
            currentCase.juzgado = currentCase.juzgado.replace(/º/g, `°`);
        }

        // Si el caso ya existe en la cache, no se guarda
        for (let auction of cacheAuctions) {
            if (auction[1].causa === currentCase.causa && auction[1].juzgado === currentCase.juzgado) {
                // si el caso ya se habia encontrado rellenar la informacion 
                const key = `${auction[1].causa}|${auction[1].juzgado}`;
                let actualCase = cacheAuctions.get(key);
                if(actualCase){
                    // console.log(`El caso con key ${key} ya se encontro rellenado info`)
                    actualCase = Caso.fillMissingData(actualCase,currentCase);
                }
                // console.log("Enviando false por cachedAuctions :",currentCase.causa);
                return false;
            }
        }
        const fechaInicioTest = new Date(`2025/09/02`);
        // Si la fecha de remate es menor a la fecha de inicio, o mayor a la final
        if (currentCase.fechaRemate && (currentCase.fechaRemate < this.fixedStartDate || currentCase.fechaRemate > this.fixedEndDate )) {
        // if (currentCase.fechaRemate && (currentCase.fechaRemate < fechaInicioTest || currentCase.fechaRemate > fechaInicioTest )) {
            // console.log(`No guardado por fecha remate ${currentCase.causa}`);
            return false;
        }
        // No se escriben casos de juez partidor
        if (currentCase.juzgado === "Juez Partidor") {
            return false;
        }

        // Agregar la busqueda de casos en DB y union si existe ya en la DB
        const caseDB = this.isCaseInDB(currentCase);
        if(caseDB){
            currentCase = Caso.bindCaseWithDB(currentCase,caseDB);
        }

        // if (currentCase.tipoPropiedad === "Estacionamiento") {
        //     return true;
        // }
        return true;
    }

    isCaseInDB(currentCase){
       const inDB = this.causaDB.searchCausa(currentCase.causa, currentCase.numeroJuzgado); 
       return inDB;
    }

    static cambiarAnchoColumnas(ws) {
        ws[`!cols`] = [
            { wch: 15 },  // A
            { wch: 15 },  // B
            { wch: 20 },  // C
            { wch: 70 },  // D
            { wch: 25 },  // E
            { wch: 15 },  // F
            { wch: 15 },  // G
            { wch: 15 },  // H
            { wch: 30 },  // I
            { wch: 20 },  // J
            { wch: 15 },  // K
            { wch: 30 },  // L
            { wch: 15 },  // M
            { wch: 20 },  // N
            { wch: 15 },  // O
            { wch: 60 },  // P
            { wch: 15 },  // Q
            { wch: 20 },  // R
            { wch: 15 },  // S
            { wch: 30 },  // T
            { wch: 15 },  // U
            { wch: 30 },  // V
            { wch: 10 },  // W
            { wch: 30 },  // X
            { wch: 15 },  // Y
            { wch: 15 },  // Z
            { wch: 15 },  // AA
            { wch: 15 },  // AB
            { wch: 15 },  // AC
            { wch: 15 },  // AD
            { wch: 25 },  // AE
            { wch: 15 },  // AF
            { wch: 15 },  // AG
            { wch: 15 },  // AH
            { wch: 15 },  // AI
            { wch: 15 },  // AJ
            { wch: 15 },  // AK
            { wch: 15 },  // AL
            { wch: 15 },  // AM
            { wch: 15 },  // AN
            { wch: 15 },  // AO
            { wch: 15 },  // AP
            { wch: 15 },  // AQ
            { wch: 25 },  // AR
        ];
    }
}

// Dado un string con el formato yyyy-mm-dd, devuelve un string con el formato dd-mm-yyyy
function cambiarFormatoFecha(fecha) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    return `${día}-${mes}-${año}`;  // Construimos el nuevo formato
}

// Dado un string con el formato yyyy-mm-dd, devuelve un objeto Date
function stringToDate(fecha) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    return new Date(`${año}/${mes}/${día}`);
}
// Dado un juzgado, obtiene la comuna del juzgado
function getComunaJuzgado(juzgado) {
    if (juzgado == null) {
        return null;
    }
    const juzgadoNormalizado = juzgado.toLowerCase();
    const comunaJuzgado = juzgadoNormalizado.split("de ").at(-1);
    return comunaJuzgado;
}
function formatDateToSQLite(date) {
    // Asegúrate de que el parámetro sea un objeto Date válido
    if (!(date instanceof Date) || isNaN(date)) {
        throw new Error("El parámetro debe ser un objeto Date válido.");
    }

    // Obtener el año, mes y día
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, `0`); // Los meses van de 0 a 11
    const day = String(date.getDate()).padStart(2, `0`);

    // Formatear como YYYY-MM-DD
    return `${year}-${month}-${day}`;
}

function fechaMenosUno(fecha) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    return nuevaFecha;
}
function writeLine(ws, row, col, value, type) {
    if (value != null) {
        ws[row + col] = { v: value, t: type };
    }
}

function insertarCasoIntoWorksheet(caso, ws, currentRow) {
    let newRol = caso.rolPropiedad;
    if (caso.fechaPublicacion && caso.fechaPublicacion instanceof Date) {
        ws[`${config.INICIO}` + currentRow] = { v: caso.fechaPublicacion, t: 'd', z: 'dd/mm/yyyy' };
    }
    // console.log("Fecha de obtenion : ", caso.fechaObtencion, "Tipo :", typeof caso.fechaObtencion);
    if (caso.fechaObtencion && caso.fechaObtencion instanceof Date) {
        ws[`${config.FECHA_DESC}` + currentRow] = { v: caso.fechaObtencion, t: 'd', z: 'dd/mm/yyyy' };
    }
    writeLine(ws, `${config.ORIGEN}`, currentRow, caso.link, 's');
    // ws[`E`+ currentRow ] = {v: 'notas ', t: 's'};
    if (caso.fechaRemate && caso.fechaRemate instanceof Date) {
        ws[`${config.FECHA_REM}` + currentRow] = { v: caso.fechaRemate, t: 'd', z: 'DD/MM/YYYY' };
    }
    writeLine(ws, `${config.MARTILLERO}`, currentRow, caso.martillero, 's');
    if (caso.tipoDerecho) {
        writeLine(ws, `${config.MARTILLERO}`, currentRow, caso.tipoDerecho, 's');
    } else if (caso.isPaid) {
        writeLine(ws, `${config.MARTILLERO}`, currentRow, "(Pagado)", 's');
    } else if (caso.isAvenimiento) {
        writeLine(ws, `${config.MARTILLERO}`, currentRow, "(Avenimiento)", 's');
    }
    // Revisamos si el caso tiene estacionamiento o bodega, y adaptamos la direccion
    // const newDireccion = this.checkEstacionamientoBodega(caso)
    writeLine(ws, `${config.DIRECCION}`, currentRow, caso.unitDireccion, 's');

    writeLine(ws, `${config.CAUSA}`, currentRow, caso.causa, 's');
    writeLine(ws, `${config.TRIBUNAL}`, currentRow, caso.juzgado, 's');
    writeLine(ws, `${config.COMUNA_TRIBUNAL}`, currentRow, getComunaJuzgado(caso.juzgado), 's');
    writeLine(ws, `${config.COMUNA}`, currentRow, caso.comuna, 's');
    writeLine(ws, `${config.ANNO}`, currentRow, caso.anno, 'n');
    writeLine(ws, `${config.PARTES}`, currentRow, caso.partes, 's');
    // ws[`O`+ currentRow ] = {v: 'dato ', t: 's'};
    writeLine(ws, `${config.VV_O_CUPON}`, currentRow, caso.formatoEntrega, 's');
    writeLine(ws, `${config.PORCENTAJE}`, currentRow, caso.porcentaje, 's');
    writeLine(ws, `$${config.PLAZOVV}`, currentRow, caso.diaEntrega, 's');
    // ws[`T`+ currentRow ] = {v: caso.rolPropiedad, t: 's'};
    // ws[`U`+ currentRow ] = {v: 'deuda 2 ', t: 's'};
    // ws[`V`+ currentRow ] = {v: 'deuda 3 ', t: 's'};

    // Union de roles de propiedad, estacionamiento y bodega
    // console.log("Rol adaptado: ", newRol);
    writeLine(ws, `${config.ROL}`, currentRow, caso.unitRol, 's');

    // ws[`X`+ currentRow ] = {v: 'notif ', t: 's'};
    // Formato de monto minimo segun el tipo de moneda
    if (caso.montoMinimo > 100) {
        if (caso.moneda === `UF`) {
            ws[`${config.PRECIO_MINIMO}` + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0.0000' };
        }
        else if (caso.moneda == `Pesos`) {
            ws[`${config.PRECIO_MINIMO}` + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0' };
        }
        writeLine(ws, `${config.PRECIO_MINIMO2}`, currentRow, caso.moneda, 's');
    }
    if (caso.avaluoPropiedad != null) {
        // const sumAvaluo = this.sumAvaluo(caso.avaluoPropiedad, caso.avaluoEstacionamiento, caso.avaluoBodega);
        ws[`${config.AVALUO_FISCAL}` + currentRow] = { v: caso.unitAvaluo, t: 'n', z: '#,##0' };
    }
    writeLine(ws, `${config.ESTADO_CIVIL}`, currentRow, caso.estadoCivil, "s");
    if (caso.montoCompra && caso.montoCompra.monto) {
        ws[`${config.PX_COMPRA}` + currentRow] = { v: caso.montoCompra.monto, t: 'n' };
    }
    writeLine(ws, `${config.ANNO_COMPRA}`, currentRow, caso.anno, "n");
    writeLine(ws, `${config.DEUDA_HIPOTECA}`, currentRow, caso.deudaHipotecaria, "n");
    // ws[`AG` + currentRow ] = {v: 'año compr ant ', t: 's'};
    // ws[`AH` + currentRow ] = {v: 'precio venta nos ', t: 's'};
}



module.exports = {createExcel, writeLine,insertarCasoIntoWorksheet};