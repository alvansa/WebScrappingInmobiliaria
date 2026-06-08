//Necesario si o si
const XLSX = require(`xlsx`);
const fs = require(`fs`);
const path = require(`path`);
const Causas = require(`../../model/Causas.js`);
const config = require("../../config.js");
const Caso = require(`../caso/caso.js`);
const {fixStringDate, transformDateString} = require(`../../utils/cleanStrings.js`);
const excelRowWriter = require(`./excelRowWriter.js`);
const excelTemplateBuilder = require(`./excelTemplateBuilder.js`);

const PJUD = config.PJUD;
const EMOL = config.EMOL;
const LIQUIDACIONES = config.LIQUIDACIONES;
const PREREMATES = config.PREREMATES;
// const config = config.LETRAS;

const MACAL = 0
const ONEDAY = 1
const ONE = 2
const PRELIMINAR = 3;

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


    async writeData(casos, name = "") {
        console.log("=====================\nEscibiendo informacion en excel\n==============================");
        let filePath = path.join(this.saveFile, `Remates.xlsx`);
        // Revisa si el archivo base ya existe
        if (!fs.existsSync(path.join(this.saveFile, `Remates.xlsx`))) {
            excelTemplateBuilder.buildTemplate(this.saveFile);
        }
        // Lee el archivo base para poder insertar los datos
        const wb = XLSX.readFile(path.join(this.saveFile, `Remates.xlsx`));
        const ws = wb.Sheets[`Remates`];
        excelTemplateBuilder.cambiarAnchoColumnas(ws);
        let lastRow = 5; // Comienza después de la fila de encabezado
        try {
            if (this.type === "one") {
                lastRow = this.fillWithOne(ws, casos);
                filePath = path.join(this.saveFile, `Caso_` + casos.causa + casos.juzgado + '.xlsx');
            } else if (this.type === "oneDay") {
                lastRow = await this.insertCasos(casos, ws) - 1;
                filePath = path.join(this.saveFile, name + `.xlsx`);
            }else if (this.type === "macal") {
                lastRow = this.insertMacal(casos,ws);
                const dateToday = `1-1-25`
                filePath = path.join(this.saveFile, `Remates_macal_` + dateToday + '.xlsx');
            }else if(this.type == PRELIMINAR){

            }
            else {
                lastRow = await this.insertarCasosExcel(casos, ws) - 1;
                const fechaInicioDMA = cambiarFormatoFecha(this.startDate);
                const fechaFinDMA = cambiarFormatoFecha(this.endDate);
                filePath = path.join(this.saveFile, `Remates_` + fechaInicioDMA + '_a_' + fechaFinDMA + '.xlsx');
            }
            ws[`!ref`] = RANGO_EXCEL + lastRow;
            console.log(`Guardando archivo en : ${filePath}`);
            XLSX.writeFile(wb, filePath, {cellDates: true});
            return filePath;
        } catch (error) {
            console.error(`Error al obtener resultados:`, error);
            return null;
        }

    }

    async insertCasos(casos, ws) {
        let currentRow = 6;
        for (let caso of casos) {
            // insertarCasoIntoWorksheet(caso.toObject(), ws, currentRow);
            await excelRowWriter.writeCasoRow(ws, currentRow, caso);
            currentRow = currentRow + 1;
        }
        return currentRow;
    }

    async insertMacal(casos, ws) {
        let currentRow = 6;
        for(let caso of casos){
            await excelRowWriter.writeMacalRow(ws,currentRow,caso);
            currentRow = currentRow + 1;
        }
        return currentRow;
    }

    createFeaturesSummary(generalFeatures) {
        if (!Array.isArray(generalFeatures)) return '';

        const features = {};
        const mappings = {
            'dormitorio': 'd', 'dormitorios': 'd',
            'baño': 'b', 'baños': 'b', 'bano': 'b', 'banos': 'b',
            'estacionamiento': 'est',
            'bodega': 'bod',
            'superficie': 'm2', 'superficie útil': 'm2', 'terreno': 'm2'
        };

        generalFeatures.forEach(({ label, value }) => {
            const labelLower = label?.toLowerCase();
            if (!labelLower || !value) return;

            for (const [key, abbr] of Object.entries(mappings)) {
                if (labelLower.includes(key)) {
                    if (abbr === 'm2') {
                        // Para metros: limpiar y mantener formato
                        if(value.toLowerCase().includes('m2')){
                            const cleanValue = value.replace(/[^\d\s]2/g, '').trim();
                            features[abbr] = cleanValue ? cleanValue + 'm2' : value;
                        }else{
                            const numericValue = value.replace(/[^\d]/g, '');
                            if (numericValue) features[abbr] = numericValue + 'ha';
                        }
                    } else {
                        // Para otras: solo el número
                        const numericValue = value.replace(/[^\d]/g, '');
                        if (numericValue) features[abbr] = numericValue + abbr;
                    }
                    break;
                }
            }
        });

        return ['d', 'b', 'est', 'bod', 'm2']
            .map(abbr => features[abbr])
            .filter(Boolean)
            .join('-');
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
        //TODO: Cambiar esto para que quede claro que es un map
        let remates = new Map();
        let currentRow = 6;

        if (!Array.isArray(casos) || casos.length === 0) {
            return;
        }
        console.log('Casos a procesar:', casos.length);

        // Primero se leen todos los casos obtenidos y se verifican para agregarlos,
        // en caso de que ya hayan sido agregados se une la informacion 
        for(let caso of casos){
            if (caso.fechaPublicacion === "N/A" || caso.fechaPublicacion == null) {
                caso.fechaPublicacion = fechaMenosUno(this.endDate);
            }
            if(this.getValidAuctions(caso, remates) || this.isTestMode){
                this.addObjectToSet(remates,caso);
            }
        }

        // Se escriben todos los casos revisados en la hoja, para eso primero se transforman a
        // objetos para verificar la normalizacion
        for (let caso of remates) {
            const casoObj = caso[1].toObject()
            await insertarCasoIntoWorksheet(casoObj, ws, currentRow);
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
                    actualCase = Caso.fillMissingData(actualCase,currentCase);
                }
                return false;
            }
        }
        const fechaInicioTest = new Date(`2025/09/02`);
        // Si la fecha de remate es menor a la fecha de inicio, o mayor a la final
        if (currentCase.fechaRemate && (currentCase.fechaRemate < this.fixedStartDate || currentCase.fechaRemate > this.fixedEndDate )) {
        // if (currentCase.fechaRemate && (currentCase.fechaRemate < fechaInicioTest || currentCase.fechaRemate > fechaInicioTest )) {
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
        return true;
    }

    isCaseInDB(currentCase){
       const inDB = this.causaDB.searchCausa(currentCase.causa, currentCase.numeroJuzgado); 
       return inDB;
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

async function insertarCasoIntoWorksheet(caso, ws, currentRow) {
    if (caso.fechaPublicacion && caso.fechaPublicacion instanceof Date) {
        ws[`${config.INICIO}` + currentRow] = { v: caso.fechaPublicacion, t: 'd', z: 'dd/mm/yyyy' };
    }
    writeLine(ws, `${config.ESTADO}`, currentRow, caso.tp, 's');
    if (caso.fechaObtencion && caso.fechaObtencion instanceof Date) {
        ws[`${config.FECHA_DESC}` + currentRow] = { v: caso.fechaObtencion, t: 'd', z: 'dd/mm/yyyy' };
    }
    writeLine(ws, `${config.ORIGEN}`, currentRow, caso.link, 's');

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

    writeLine(ws, `${config.DIRECCION}`, currentRow, caso.unitDireccion, 's');
    writeLine(ws, `${config.CAUSA}`, currentRow, caso.causa, 's');
    writeLine(ws, `${config.TRIBUNAL}`, currentRow, caso.juzgado, 's');
    writeLine(ws, `${config.COMUNA_TRIBUNAL}`, currentRow, getComunaJuzgado(caso.juzgado), 's');
    writeLine(ws, `${config.COMUNA}`, currentRow, caso.comuna, 's');
    writeLine(ws, `${config.ANNO}`, currentRow, caso.anno, 'n');
    writeLine(ws, `${config.PARTES}`, currentRow, caso.partes, 's');
    writeLine(ws, `${config.DATO}`, currentRow, caso.metros, 's');
    writeLine(ws, `${config.VV_O_CUPON}`, currentRow, caso.formatoEntrega, 's');
    writeLine(ws, `${config.PORCENTAJE}`, currentRow, caso.porcentaje, 's');
    writeLine(ws, `${config.PLAZOVV}`, currentRow, caso.diaEntrega, 's');
    // ws[`T`+ currentRow ] = {v: caso.rolPropiedad, t: 's'};
    // ws[`U`+ currentRow ] = {v: 'deuda 2 ', t: 's'};
    // ws[`V`+ currentRow ] = {v: 'deuda 3 ', t: 's'};

    // Union de roles de propiedad, estacionamiento y bodega
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
    if(caso.montoMinimo2){
        writeLine(ws, `${config.PRECIO_MINIMO2}`, currentRow, caso.montoMinimo2, 'n');
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
    writeLine(ws, `${config.DEUDA_BANCO}` , currentRow, caso.mortageBank , 's')
    writeLine(ws, `${config.DEUDA_HIPOTECA}`, currentRow, caso.deudaHipotecaria, "s");
    writeLine(ws, `${config.DEUDA_PAGARE}`, currentRow, caso.deudaPagare, "s");
    console.log(`Escribiendo el excel con el caso :${caso.causa} con link: ${caso.linkMap}`);
    writeLine(ws, `${config.OTRA_DEUDA}`, currentRow, caso.linkMap, 's');
    // ws[`AG` + currentRow ] = {v: 'año compr ant ', t: 's'};
    // ws[`AH` + currentRow ] = {v: 'precio venta nos ', t: 's'};
}



module.exports = {createExcel, writeLine,insertarCasoIntoWorksheet};