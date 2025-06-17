//Necesario si o si
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Causas = require('../../model/Causas.js');
const config = require("../../config.js");
const { cleanInitialZeros } = require('../../utils/cleanStrings.js');
const Caso = require('../caso/caso.js');

const PJUD = 2;
const THREE_SAME = 0;
const ONE_TWO = 1;
const ONE_THREE = 2;
const TWO_THREE = 3;
const THREE_DIFF = 4;



class createExcel {
    constructor(saveFile, startDate, endDate, emptyMode, type) {
        this.saveFile = saveFile;
        this.startDate = startDate;
        this.endDate = endDate;
        this.emptyMode = emptyMode;
        this.type = type;

    }
    crearBase() {
        // Crea una hoja de cálculo vacía
        const ws = {};

        ws['A5'] = { v: 'vacia', t: 's' };
        ws['B5'] = { v: 'status', t: 's' };
        ws['C5'] = { v: 'F.Desc', t: 's' };
        ws['D5'] = { v: 'origen', t: 's' };
        ws['E5'] = { v: 'notas', t: 's' };
        ws['F5'] = { v: 'F. remate', t: 's' };
        ws['G5'] = { v: 'macal', t: 's' };
        ws['H5'] = { v: 'direccion', t: 's' };
        ws['I5'] = { v: 'causa', t: 's' };
        ws['J5'] = { v: 'tribunal', t: 's' };
        ws['K5'] = { v: 'comuna tribunal', t: 's' };
        ws['L5'] = { v: 'comuna propiedad', t: 's' };
        ws['M5'] = { v: 'año inscripcion', t: 's' };
        ws['N5'] = { v: 'partes', t: 's' };
        ws['O5'] = { v: 'dato', t: 's' };
        ws['P5'] = { v: 'vale vista o cupon', t: 's' };
        ws['Q5'] = { v: '%', t: 's' };
        ws['R5'] = { v: 'plazo vv', t: 's' };
        ws['S5'] = { v: 'tipo derecho', t: 's' };
        ws['T5'] = { v: 'deuda 1', t: 's' };
        ws['U5'] = { v: 'deuda 2', t: 's' };
        ws['V5'] = { v: 'deuda 3', t: 's' };
        ws['W5'] = { v: 'rol', t: 's' };
        ws['X5'] = { v: 'notif', t: 's' };
        ws['Y5'] = { v: 'preciominimo', t: 's' };
        ws['Z5'] = { v: 'UF o $', t: 's' };
        ws['AC5'] = { v: 'avaluo fiscal', t: 's' };
        ws['AE5'] = { v: 'estado civil', t: 's' };
        ws['AF5'] = { v: 'Px $ compra ant', t: 's' };
        ws['AG5'] = { v: 'año compr ant', t: 's' };
        ws['AH5'] = { v: 'precio venta nos', t: 's' };
        ws['AE5'] = { v: 'estado civil', t: 's' };

        ws['AP5'] = { v: 'Deuda Hipotecaria', t: 's' };

        // Ajusta el ancho de las columnas
        this.cambiarAnchoColumnas(ws);

        // Define el rango de la hoja para asegurar que incluya todas las celdas especificadas
        ws['!ref'] = 'A5:AP5';

        // Crea un nuevo libro y agrega la hoja
        const wb = XLSX.utils.book_new();
        wb.Props = {
            Title: 'Remates',
            Subject: 'Remates'
        };

        // Agrega la hoja al libro de trabajo
        XLSX.utils.book_append_sheet(wb, ws, 'Remates');

        // Guarda el archivo
        XLSX.writeFile(wb, path.join(this.saveFile, 'Remates.xlsx'));
    }


    async writeData(casos, name = "") {
        console.log("=====================\nEscibiendo informacion en excel\n==============================");
        let filePath = path.join(this.saveFile, 'Remates.xlsx');
        // Revisa si el archivo base ya existe
        if (!fs.existsSync(path.join(this.saveFile, 'Remates.xlsx'))) {
            this.crearBase(this.saveFile);
            console.log('Archivo creado');
        }
        // Lee el archivo base para poder insertar los datos
        const wb = XLSX.readFile(path.join(this.saveFile, 'Remates.xlsx'));
        const ws = wb.Sheets['Remates'];
        this.cambiarAnchoColumnas(ws);

        try {
            if (this.type === "one") {
                const lastRow = this.fillWithOne(ws, casos);
                ws['!ref'] = 'A5:AP' + lastRow;
                filePath = path.join(this.saveFile, 'Caso_' + casos.causa + casos.juzgado + '.xlsx');
            } else if (this.type === "oneDay") {
                let lastRow = this.insertCasos(casos, ws) - 1;
                ws['!ref'] = 'A5:AP' + lastRow;
                filePath = path.join(this.saveFile, name + '.xlsx');
            } else {
                let lastRow = await this.insertarCasosExcel(casos, ws) - 1;
                ws['!ref'] = 'A5:AP' + lastRow;
                const fechaInicioDMA = cambiarFormatoFecha(this.startDate);
                const fechaFinDMA = cambiarFormatoFecha(this.endDate);
                filePath = path.join(this.saveFile, 'Remates_' + fechaInicioDMA + '_a_' + fechaFinDMA + '.xlsx');
            }
            XLSX.writeFile(wb, filePath);
            return filePath;
        } catch (error) {
            console.error('Error al obtener resultados:', error);
            return null;
        }

    }

    insertCasos(casos, ws) {
        let currentRow = 6;
        for (let caso of casos) {
            this.insertarCasoIntoWorksheet(caso.toObject(), ws, currentRow);
            currentRow = currentRow + 1;
        }
        return currentRow;
    }


    fillWithOne(ws, casos) {
        const caso = casos.toObject();

        let currentRow = 6;
        this.insertarCasoIntoWorksheet(caso, ws, currentRow);
        currentRow = currentRow + 1;
        return currentRow
    }

    async insertarCasosExcel(casos, ws) {
        const startDateSQL = stringToDate(this.startDate);
        let remates = new Map();
        let currentRow = 6;
        const causaDB = new Causas();
        const rematesDB = causaDB.getCausas(formatDateToSQLite(startDateSQL));
        for (let remateDB of rematesDB) {
            if (remateDB.juzgado) {
                remateDB.juzgado = remateDB.juzgado.replace(/º/g, '°');
            }
        }
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
            if(this.getValidAuctions(caso, remates, rematesDB, startDateSQL)){
                this.addObjectToSet(remates,caso);
            }
        }
        console.log("Total de casos en remates: ", remates.length);

        // Se escriben todos los casos revisados en la hoja, para eso primero se transforman a
        // objetos para verificar la normalizacion
        for (let caso of remates) {
            // if (!this.emptyMode) {
            //     remates.add({ causa: caso.causa, juzgado: caso.juzgado, fecha: formatDateToSQLite(caso.fechaPublicacion) });
            // }
            console.log("Escribiendo caso :", caso.causa);
            const casoObj = caso[1].toObject()

            this.insertarCasoIntoWorksheet(casoObj, ws, currentRow);
            currentRow++;
        }
        // Agrega los remates a la base de datos
        if (!this.emptyMode) {
            causaDB.insertCaso(remates);
        }
        return currentRow;
    }

    addObjectToSet(remates,caso){
        const key = `${caso.causa}|${caso.juzgado}`;
        if(!remates.has(key)){
            remates.set(key, caso);
            console.log(`Insertando caso con key ${key}`);
        }
    }

    getValidAuctions(currentCase, cacheAuctions, auctionsDB, startDateSQL) {
        if (currentCase.juzgado) {
            currentCase.juzgado = currentCase.juzgado.replace(/º/g, '°');
        }

        // Si el caso ya existe en la cache, no se guarda
        for (let auction of cacheAuctions) {
            if (auction[1].causa === currentCase.causa && auction[1].juzgado === currentCase.juzgado) {
                // si el caso ya se habia encontrado rellenar la informacion 
                const key = `${auction[1].causa}|${auction[1].juzgado}`;
                let actualCase = cacheAuctions.get(key);
                if(actualCase){
                    console.log(`El caso con key ${key} ya se encontro rellenado info`)
                    actualCase = Caso.fillMissingData(actualCase,currentCase);
                }
                return false;
            }
        }
        // Si la fecha de remate es menor a la fecha de inicio, no se guarda
        // if (currentCase.fechaRemate < this.startDate || currentCase.fechaRemate > this.endDate) {
        //     return false;
        // }
        // No se escriben casos de juez partidor
        if (currentCase.juzgado === "Juez Partidor") {
            return false;
        }
        if (currentCase.origen === PJUD) { // Solo si es caso es del pjud revisamos si ya existe en la base de datos
            // Si el caso ya existe en la base de datos, no se guarda
            for (let savedAuction of auctionsDB) {
                if (savedAuction.causa === currentCase.causa && savedAuction.juzgado === currentCase.juzgado && savedAuction.fecha < formatDateToSQLite(startDateSQL)) {
                    return false;
                }
            }
        }
        // if (currentCase.tipoPropiedad === "Estacionamiento") {
        //     return true;
        // }
        return true;
    }


    insertarCasoIntoWorksheet(caso, ws, currentRow) {
        let newRol = caso.rolPropiedad;
        // console.log("Fecha de obtenion : ", caso.fechaObtencion, "Tipo :", typeof caso.fechaObtencion);
        if(caso.fechaObtencion){
            ws['C' + currentRow] = { v: caso.fechaObtencion, t: 'd', z: 'dd/mm/yyyy' };
        }
        this.writeLine(ws, 'D', currentRow, caso.link, 's');
        // ws['E'+ currentRow ] = {v: 'notas ', t: 's'};
        if (caso.fechaRemate !== null) {
            const adjustedAuctionDate = caso.fechaRemate;
            // adjustedAuctionDate.setHours(adjustedAuctionDate.getHours() + 1);
            if(adjustedAuctionDate){
                ws['F' + currentRow] = { v: adjustedAuctionDate, t: 'd', z: 'dd/mm/yyyy' };
            }
            // this.writeLine(ws, 'F', currentRow, adjustedAuctionDate, 'd');
        }
        this.writeLine(ws, 'G', currentRow, caso.martillero, 's');
        if(caso.isPaid){
            this.writeLine(ws, 'G', currentRow, "(Pagado)", 's');
        }
        // Revisamos si el caso tiene estacionamiento o bodega, y adaptamos la direccion
        const newDireccion = this.checkEstacionamientoBodega(caso)
        this.writeLine(ws, 'H', currentRow, newDireccion, 's');

        this.writeLine(ws, 'I', currentRow, caso.causa, 's');
        this.writeLine(ws, 'J', currentRow, caso.juzgado, 's');
        this.writeLine(ws, 'K', currentRow, getComunaJuzgado(caso.juzgado), 's');
        this.writeLine(ws, 'L', currentRow, caso.comuna, 's');
        this.writeLine(ws, 'M', currentRow, caso.anno, 's');
        this.writeLine(ws, 'N', currentRow, caso.partes, 's');
        // ws['O'+ currentRow ] = {v: 'dato ', t: 's'};
        this.writeLine(ws, 'P', currentRow, caso.formatoEntrega, 's');
        this.writeLine(ws, 'Q', currentRow, caso.porcentaje, 's');
        this.writeLine(ws, 'R', currentRow, caso.diaEntrega, 's');
        this.writeLine(ws, 'S', currentRow, caso.tipoDerecho, 's');
        // ws['T'+ currentRow ] = {v: caso.rolPropiedad, t: 's'};
        // ws['U'+ currentRow ] = {v: 'deuda 2 ', t: 's'};
        // ws['V'+ currentRow ] = {v: 'deuda 3 ', t: 's'};

        // Union de roles de propiedad, estacionamiento y bodega
        newRol = this.adaptRol(caso.rolPropiedad, caso.rolEstacionamiento, caso.rolBodega);
        console.log("Rol adaptado: ", newRol);
        this.writeLine(ws, 'W', currentRow, newRol, 's');

        // ws['X'+ currentRow ] = {v: 'notif ', t: 's'};
        // Formato de monto minimo segun el tipo de moneda
        console.log("Leyendo monto minimo: ", caso.montoMinimo, " con moneda: ", caso.moneda);
        if (caso.moneda === 'UF') {
            ws['Y' + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0.0000' };
        }
        else if (caso.moneda == 'Pesos') {
            console.log("leyo que la moneda es pesos", caso.moneda);
            ws['Y' + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0' };
        }
        this.writeLine(ws, 'Z', currentRow, caso.moneda, 's');
        if (caso.avaluoPropiedad != null) {
            const sumAvaluo = this.sumAvaluo(caso.avaluoPropiedad, caso.avaluoEstacionamiento, caso.avaluoBodega);
            ws['AC' + currentRow] = { v: sumAvaluo, t: 'n', z: '#,##0' };
        }
        this.writeLine(ws, "AE", currentRow, caso.estadoCivil, "s");
        if (caso.montoCompra && caso.montoCompra.monto) {
            ws['AF' + currentRow] = { v: caso.montoCompra.monto, t: 'n' };
        }
        this.writeLine(ws, "AP", currentRow, caso.deudaHipotecaria, "s");
        // ws['AG' + currentRow ] = {v: 'año compr ant ', t: 's'};
        // ws['AH' + currentRow ] = {v: 'precio venta nos ', t: 's'};
    }

    checkEstacionamientoBodega(caso) {
        // console.log("Revisando estacionamiento y bodega para el caso: ", caso.hasEstacionamiento, caso.hasBodega, caso.direccionEstacionamiento);
        if (!caso.direccion) {
            return null;
        }
        if (caso.hasEstacionamiento && caso.hasBodega) {
            // console.log("Tiene estacionamiento y bodega");
            const mergeDirections = this.mergeDirections(caso.direccion, caso.direccionEstacionamiento);
            return mergeDirections + " BOD";
        } else if (caso.hasEstacionamiento) {
            // console.log("Tiene estacionamiento");
            return this.mergeDirections(caso.direccion, caso.direccionEstacionamiento);
        } else if (caso.hasBodega) {
            // console.log("Tiene bodega");
            return caso.direccion + " BOD";
        } else {
            // console.log("No tiene estacionamiento ni bodega");
            return caso.direccion;
        }
    }

    mergeDirections(dir1, dir2) {
        // Normalizar espacios y convertir a arrays de palabras

        const palabras1 = dir1.trim().toLowerCase().split(/\s+/);
        const palabras2 = dir2.trim().toLowerCase().split(/\s+/);

        // Encontrar el punto donde divergen
        let indiceDivergencia = 0;
        while (indiceDivergencia < palabras1.length &&
            indiceDivergencia < palabras2.length &&
            palabras1[indiceDivergencia] === palabras2[indiceDivergencia]) {
            indiceDivergencia++;
        }

        // Tomar la primera dirección completa y añadir las partes únicas de la segunda
        const direccionCombinada = [
            ...palabras1,
            "Est", // Añadimos "Est" para indicar estacionamiento
            ...palabras2.slice(indiceDivergencia)
        ].join(' ');

        return direccionCombinada;
    }

    //Funcion que dado un string con el avaluo de la propiedad, estacionamiento y bodega, los suma
    // Si alguno de los strings es null o undefined, se considera como 0
    sumAvaluo(avaluoPropiedadString, avaluoEstacionamientoString, avaluoBodegaString) {
        if (!avaluoPropiedadString && !avaluoEstacionamientoString && !avaluoBodegaString) {
            return null;
        }
        const avaluoPropiedad = avaluoPropiedadString ? parseInt(avaluoPropiedadString) : 0;
        const avaluoEstacionamiento = avaluoEstacionamientoString ? parseInt(avaluoEstacionamientoString) : 0;
        const avaluoBodega = avaluoBodegaString ? parseInt(avaluoBodegaString) : 0;


        return avaluoPropiedad + avaluoEstacionamiento + avaluoBodega;
    }

    // Adaptador de roles para combinar propiedad, estacionamiento y bodega
    adaptRol(rolPropiedad, rolEstacionamiento, rolBodega) {
        let rol1, rol2, rol3;
        if (!rolPropiedad && !rolEstacionamiento && !rolBodega) {
            return null;
        }
        // Limpiar y validar roles
        const cleanedRoles = [
            this.cleanRol(rolPropiedad),
            this.cleanRol(rolEstacionamiento),
            this.cleanRol(rolBodega)
        ].filter(rol => rol !== null && rol !== undefined);

        // Si solo queda un rol válido, retornarlo directamente
        if (cleanedRoles.length === 1) {
            return cleanedRoles[0];
        }
        [rol1, rol2, rol3] = cleanedRoles;
        console.log("Roles limpios: ", rol1, rol2, rol3);
        const comparisonResult = this.checkFirstHalves(rol1, rol2, rol3);
        const finalRol = this.mergeRol(rol1, rol2, rol3, comparisonResult);
        return finalRol;
    }

    checkFirstHalves(rolOne, rolTwo, rolThree) {
        let result;
        if (rolOne && rolTwo && rolThree) {
            result = this.checkThreeHalfs(rolOne, rolTwo, rolThree);
        } else if (rolOne && rolTwo) {
            result = this.checkTwoHalfs(rolOne, rolTwo) ? ONE_TWO : THREE_DIFF;
        } else if (rolOne && rolThree) {
            result = this.checkTwoHalfs(rolOne, rolThree) ? ONE_THREE : THREE_DIFF;
        } else if (rolTwo && rolThree) {
            result = this.checkTwoHalfs(rolTwo, rolThree) ? TWO_THREE : THREE_DIFF;
        } else {
            return null;
        }
        return result;
    }

    checkThreeHalfs(rolOne, rolTwo, rolThree) {
        const halfOne = rolOne.split("-")[0];
        const halfTwo = rolTwo.split("-")[0];
        const halfThree = rolThree.split("-")[0];
        console.log("Roles: ", halfOne, halfTwo, halfThree);
        if (halfOne == halfTwo && halfTwo == halfThree) {
            return THREE_SAME;
        } else if (halfOne == halfTwo) {
            return ONE_TWO;
        } else if (halfOne == halfThree) {
            return ONE_THREE;
        } else if (halfTwo == halfThree) {
            return TWO_THREE;
        } else if (halfOne != halfTwo && halfOne != halfThree && halfTwo != halfThree) {
            return THREE_DIFF;
        } else {
            return null;
        }
    }

    checkTwoHalfs(rolOne, rolTwo) {
        const halfOne = rolOne.split("-")[0];
        const halfTwo = rolTwo.split("-")[0];

        if (halfOne == halfTwo) {
            return true;
        } else if (halfOne != halfTwo) {
            return false;
        } else {
            return null;
        }
    }

    mergeRol(rol1, rol2, rol3, areSame) {
        let final;
        console.log("Roles a unir: ", rol1, rol2, rol3, "Resultado de la comparacion: ", areSame);
        switch (areSame) {
            case THREE_SAME:
                console.log("3 iguales");
                final = this.mergeThreeRoles(rol1, rol2, rol3);
                break;

            case ONE_TWO:
                console.log("1 y 2 iguales");
                final = this.mergeDiffRoles(this.mergeTwoRoles(rol1, rol2), rol3);
                console.log("Rol final cuando 1 y 2 son iguales: ", final);
                break;

            case ONE_THREE:
                console.log("1 y 3 iguales");

                final = this.mergeDiffRoles(this.mergeTwoRoles(rol1, rol3), rol2)
                break;

            case TWO_THREE:
                console.log("2 y 3 iguales");
                final = this.mergeDiffRoles(this.mergeTwoRoles(rol2, rol3), rol1)
                break;
            case THREE_DIFF:
                console.log("3 diferentes");
                final = this.mergeDiffRoles(rol1, rol2, rol3)

                break;
            default:
                final = null;

        }
        console.log("Rol final: ", final);
        return final;
    }

    mergeDiffRoles(rol1 = null, rol2 = null, rol3 = null) {
        console.log("Unir roles al final: ", rol1, rol2, rol3);
        if (rol1 && rol2 && rol3) {
            return rol1 + "//" + rol2 + "//" + rol3;
        } else if (rol1 && rol2) {
            return rol1 + "//" + rol2;
        } else if (rol1 && rol3) {
            return rol1 + "//" + rol3;
        } else if (rol2 && rol3) {
            return rol2 + "//" + rol3;
        } else if (rol1) {
            return rol1;
        }
    }

    // Funciones para unir dos roles
    mergeTwoRoles(rolOne, rolTwo) {
        if (!rolOne.includes("-") || !rolTwo.includes("-")) {
            return null;
        }
        const arrayRolOne = rolOne.split("-");
        const arrayRolTwo = rolTwo.split("-");
        if (arrayRolOne[0] === arrayRolTwo[0]) {
            rolOne += "-" + arrayRolTwo[1];
        }
        rolOne = rolOne.replace(/\s*/g, "");
        return rolOne;
    }

    // Función para unir tres roles
    mergeThreeRoles(rolOne, rolTwo, rolThree) {
        let twoRoles = this.mergeTwoRoles(rolOne, rolTwo);
        if (!twoRoles || !twoRoles.includes("-") || !rolThree.includes("-")) {
            if (twoRoles && twoRoles.includes("-")) {
                return twoRoles;
            } else if (rolOne.includes("-") && rolThree.includes("-")) {
                return this.mergeTwoRoles(rolOne, rolThree);
            }
            return null;
        }
        const arrayTwoRoles = twoRoles.split("-");
        const arrayRolThree = rolThree.split("-");
        if (arrayTwoRoles[0] == arrayRolThree[0]) {
            twoRoles += "-" + arrayRolThree[1];
        }
        return twoRoles
    }

    //Función para limpiar los roles de espacios de sobre, guiones largos y ceros iniciales
    cleanRol(rol) {
        if (!rol) {
            return null;
        }
        rol = rol.replace("−", "-");
        if (!rol.includes("-")) {
            return rol;
        }
        const parts = rol.split("-");
        const newFirst = cleanInitialZeros(parts[0]);
        const newSecond = cleanInitialZeros(parts[1]);
        return newFirst + "-" + newSecond;
    }


    writeLine(ws, row, col, value, type) {
        if (value != null) {
            ws[row + col] = { v: value, t: type };
        }
    }


    cambiarAnchoColumnas(ws) {
        ws['!cols'] = [
            { wch: 15 },  // A
            { wch: 15 },  // B
            { wch: 20 },  // C
            { wch: 70 },  // D
            { wch: 25 },  // E
            { wch: 15 },  // F
            { wch: 30 },  // G
            { wch: 20 },  // H
            { wch: 15 },  // I
            { wch: 30 },  // J
            { wch: 15 },  // K
            { wch: 20 },  // L
            { wch: 15 },  // M
            { wch: 60 },  // N
            { wch: 15 },  // O
            { wch: 20 },  // P
            { wch: 15 },  // Q
            { wch: 30 },  // R
            { wch: 15 },  // S
            { wch: 30 },  // T
            { wch: 10 },  // U
            { wch: 30 },  // V
            { wch: 15 },  // W
            { wch: 15 },  // X
            { wch: 15 },  // Y
            { wch: 15 },  // Z
            { wch: 15 },  // AA
            { wch: 15 },  // AB
            { wch: 25 },  // AC
            { wch: 15 },  // AD
            { wch: 15 },  // AE
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
            { wch: 25 },  // AP
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
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
    const day = String(date.getDate()).padStart(2, '0');

    // Formatear como YYYY-MM-DD
    return `${year}-${month}-${day}`;
}

function fechaMenosUno(fecha) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    return nuevaFecha;
}



module.exports = createExcel;