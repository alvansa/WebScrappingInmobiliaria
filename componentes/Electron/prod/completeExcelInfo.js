const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const Caso = require('../../caso/caso.js');
const CasoBuilder = require('../../caso/casoBuilder.js');
const GestorRematesPjud = require('../../pjud/GestorRematesPjud.js');
const {writeLine,insertarCasoIntoWorksheet,createExcel} = require('../../excel/createExcel.js')
const {tribunalesPorCorte, obtainCorteJuzgadoNumbers} = require('../../../utils/corteJuzgado.js');
const {stringToDate} = require('../../../utils/cleanStrings.js');   
const {matchJuzgado, matchRol} = require('../../../utils/compareText.js');
const config = require('../../../config.js');
const PJUD = config.PJUD;
const EMOL = config.EMOL;
const LIQUIDACIONES = config.LIQUIDACIONES;

const LETRA_FECHA_DESC = 'C';
const LETRA_ORIGEN = 'D';
const LETRA_FECHA_REM = 'F';
const LETRA_CAUSA = 'J';
const LETRA_JUZGADO = 'K';
const LETRA_COMUNA = 'M';
const LETRA_PARTES = 'O';
const LETRA_ROL = 'X';
const LETRA_PORCENTAJE = 'AM';

const COLUMNAS_EXCEL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z','AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ'];

const COlUMNAS_MANTENER = ['C', 'D', 'F', 'J', 'K','L', 'Z'];

class CompleteExcelInfo{
    constructor(filePath,event,mainWindow){
        this.filePath = filePath;
        this.mainWindow = mainWindow;
        this.event = event;
        this.casos = [];
    }

    async fillData(){
        const wb = XLSX.readFile(this.filePath, {cellDates: true});
        const ws = wb.Sheets[wb.SheetNames[0]];
        let lastRow = 6;

        // Obtain de auctions
        lastRow = this.getCausasFromExcel(ws,lastRow);

        console.log(`Casos a buscar: ${this.casos.length}`);
        if(this.casos.length == 0){
            return true;
        }
    

        // Process de auctions
        await this.obtainNewData()


        // Write the new data
        this.writeData(ws);
        console.log('------------------------------------------------------');
        // console.log(this.casos.map(obj => obj.toObject()));

        createExcel.cambiarAnchoColumnas(ws);
        ws['!ref'] = 'A5:AQ' + lastRow;
        const fileName = this.filePath.split('.')[0];
        const filePath = fileName+'Completo'+'.xlsx';
        XLSX.writeFile(wb,filePath, { cellDates: true });
        return this.filePath;
    }

    getCausasFromExcel(ws,lastRow){
        let origen;
        while(ws[`${LETRA_CAUSA}${lastRow}`]){
            let fechaDesc = ws[`${LETRA_FECHA_DESC}${lastRow}`];
            let link = ws[`${LETRA_ORIGEN}${lastRow}`].v;
            let fechaRem = ws[`${LETRA_FECHA_REM}${lastRow}`];
            const causa = ws[`${LETRA_CAUSA}${lastRow}`].v;
            const juzgado = ws[`${LETRA_JUZGADO}${lastRow}`].v
            const celdaPartes = ws[`${LETRA_PARTES}${lastRow}`]
            let partes = null;
            // console.log(`fechaRem type: ${JSON.stringify(fechaRem,null,4)}`);
            if(celdaPartes){
                partes = celdaPartes.v;
            }
            if(fechaRem){
                fechaRem = stringToDate(fechaRem.w);
            }else{
                fechaRem = null;
            }

            if(fechaDesc){
                fechaDesc = stringToDate(fechaDesc.w);
            }else{
                fechaDesc = null;
            }
            if(origen){
                if(origen == 'Lgr'){
                    origen = PJUD;
                }else if(origen.includes('economico')){
                    origen = EMOL;
                }else if(origen.includes('Boletin')){
                    origen = LIQUIDACIONES;
                }
            }
            console.log(`cont = ${lastRow - 5} Fecha Remate: ${fechaRem} y fecha Desc: ${fechaDesc} `);
            const casoExcel = new CasoBuilder(new Date(fechaDesc),link, origen)
                .conExcel(causa,juzgado,partes)
                .conFechaRemate(fechaRem)
                .construir();

            // console.log(causa);
            if(!casoExcel.partes){
                this.casos.push(casoExcel)
            }
            lastRow++;
        }
        return lastRow;
    }

    async obtainNewData(){
        try{
            obtainCorteJuzgadoNumbers(this.casos);
            const gestorRemates = new GestorRematesPjud(this.casos, this.event, this.mainWindow);
            const result = await gestorRemates.getInfoFromAuctions();
            return true;
        }catch(error){
            console.error('Error al obtener nueva información:', error);
            return false;
        }
    }

    writeData(ws) {
        for (let caso of this.casos) {
            const actualCausa = caso.causa;
            let lastRow = 6;
            while (ws[`${LETRA_CAUSA}${lastRow}`]) {
                const celda = ws[`${LETRA_CAUSA}${lastRow}`];
                const causaExcel = celda.v;
                if(actualCausa == causaExcel){
                    console.log(`Actualizando caso: ${actualCausa} en la fila ${lastRow}`);
                    insertarCasoIntoWorksheet(caso,ws,lastRow)
                }
                lastRow++;
            }
        }
    }

    static searchRepeatedCases(excelBase, excelNuevo) {

        const wbBase = XLSX.readFile(excelBase, {cellDates: true});
        const wsBase = wbBase.Sheets[wbBase.SheetNames[0]];
        const wbNew = XLSX.readFile(excelNuevo, {cellDates: true});
        const wsNew = wbNew.Sheets[wbNew.SheetNames[0]];

        let lastRowNew = this.obtainLastRow(wsNew);

        const findedCausas = this.findRepeatedAuctions(wsBase, wsNew);

        console.log(`Causas a buscar: ${findedCausas.length}`);
        console.table(findedCausas.map(causa => ({
            causa: causa.causa,
            Rol : causa.rol,
            baseLine: causa.baseLine,
            newLine: causa.newLine
        })));
        lastRowNew = lastRowNew + 5;
        findedCausas.forEach(causa => {
            // console.log(`Causa: ${causa.causa} encontrada en la fila: ${causa.linea}`);
            //copiar la fila x en la hoja de excel nueva
            const newCausaCell = wsNew[`${LETRA_CAUSA}${lastRowNew}`];
            if(newCausaCell){
                newCausaCell.v = causa.causa;
            }else{
                // console.log('Copiando linea ',lastRowNew)
                this.copyRowFromBaseToNew(wsBase, wsNew, causa.baseLine, causa.newLine);
            }   
            lastRowNew++;
        });
        this.saveNewExcel(wbNew, wsNew, lastRowNew, excelNuevo);
    }

    static saveNewExcel(wb, ws, lastRow, filePath) {
        this.formatDates(ws);
        createExcel.cambiarAnchoColumnas(ws);
        ws['!ref'] = 'A5:AQ' + lastRow;
        const fileName = filePath.split('.')[0];
        const newFilePath = fileName+'Completo'+'.xlsx';
        XLSX.writeFile(wb,newFilePath, { cellDates: true });
    }

    static obtainLastRow(ws) {
        let lastRow = 6;
        while(ws[`${LETRA_FECHA_REM}${lastRow}`]){
            lastRow++;
        }
        return lastRow - 1; // Retorna la última fila con datos
    }

    static findRepeatedAuctions(wsBase, wsNew) {
        const findedCausas = [];
        const lastRowBase = this.obtainLastRow(wsBase);
        let actualRowBase = lastRowBase;
        let lastRowNew = 6;
        while(wsNew[`${LETRA_FECHA_DESC}${lastRowNew}`]){
            const {causa, juzgado,comuna,rol, isValid} = this.processNewRow(wsNew, lastRowNew);
            if(!isValid){
                lastRowNew++;
                continue;
            }

            actualRowBase = lastRowBase;
            while(actualRowBase >= 1){

                const cellCausa = wsBase[`${LETRA_CAUSA}${actualRowBase}`];
                const cellCourt = wsBase[`${LETRA_JUZGADO}${actualRowBase}`];
                const cellComuna = wsBase[`${LETRA_COMUNA}${actualRowBase}`];
                const cellRol = wsBase[`${LETRA_ROL}${actualRowBase}`];
                // console.log(`Revisando fila ${lastRowBase} del archivo base`)
                if(this.checkCausaJuzgado(causa, juzgado, cellCausa, cellCourt, findedCausas, actualRowBase, lastRowNew)) break;
                if(this.checkComunaRol(causa,comuna, rol, cellComuna, cellRol, findedCausas, actualRowBase, lastRowNew)) break;
                actualRowBase--;
            }
            lastRowNew++;
        }
        return findedCausas;
    }

    static processNewRow(wsNew, rowNum){
        let isValid = true;
        let juzgado;
        let comuna;
        let rol;
        const causaCell = wsNew[`${LETRA_CAUSA}${rowNum}`];
        const comunaCell = wsNew[`${LETRA_COMUNA}${rowNum}`];
        const rolCell = wsNew[`${LETRA_ROL}${rowNum}`];
        
        let causa = causaCell ? causaCell.v.toUpperCase().replace(/\s*/g, '') : null;
        if(!causa){
            isValid = false;
            return {causa, juzgado, comuna, rol, isValid};
        }   
        const causaMatch = causa.match(/C-\d+-\d+/);
        if(!causaMatch){
            isValid = false;
            return {causa, juzgado, comuna, rol, isValid};
        }
        causa = causaMatch[0]; 
        if(causa == 'C-7789-2023'){
            console.log("--------------------\n",causa, causaCell,"\n----------------");
        }

        comuna = comunaCell ? comunaCell.v : null;
        rol = rolCell ? rolCell.v : null;

        juzgado = wsNew[`${LETRA_JUZGADO}${rowNum}`];
        if (!juzgado || typeof juzgado.v != 'string') {
            console.log(`No se encontró el juzgado en la fila ${rowNum}`);
            isValid = false;
            return {causa, juzgado, comuna, rol, isValid}
        }
        juzgado = juzgado.v;
        return { causa, juzgado, comuna, rol, isValid };
    }

    static checkCausaJuzgado(newCase, newCourt, baseCaseCell, baseCourtCell, findedCausas, actualRowBase, lastRowNew){
        if (!baseCaseCell || typeof baseCaseCell.v != 'string' || !baseCourtCell || typeof baseCourtCell.v != 'string') {
            return false;
        }
        let causaBase = baseCaseCell.v.toUpperCase().replace(/\s*/g, '');;
        if(!causaBase){
            isValid = false;
            return false;
        }   
        const causaMatch = causaBase.match(/C-\d+-\d+/);
        if(!causaMatch){
            return false
        }
        causaBase = causaMatch[0]; 

        const baseCourt = baseCourtCell.v;

        if (newCase == causaBase) {
            const matchedJuzgado = matchJuzgado(baseCourt, newCourt);
            if (matchedJuzgado) {
                console.log(`Causa repetida: ${newCase} fila base: ${actualRowBase} fila nueva: ${lastRowNew}`);
                findedCausas.push({ causa: newCase, rol: null,  baseLine: actualRowBase, newLine: lastRowNew });
                return true;
            }
        }
    }

    static checkComunaRol(causa,newComuna, newRol, baseComunaCell, baseRolCell,findedCausas, actualRowBase, lastRowNew){
        if (!baseComunaCell || typeof baseComunaCell.v != 'string' || !baseRolCell || typeof baseRolCell.v != 'string' || !newComuna || !newRol) {
            return;
        }
        const baseComuna = baseComunaCell.v.toLowerCase();
        const baseRol = baseRolCell.v;

        newComuna = newComuna.toLowerCase();

        if(newComuna == baseComuna){
            if(matchRol(newRol, baseRol)){
                console.log(`Causa repetida: ${causa} Rol:${newRol} fila base: ${actualRowBase} fila nueva: ${lastRowNew}`);
                findedCausas.push({ causa: causa, rol: newRol, baseLine: actualRowBase, newLine: lastRowNew });
                return true;
            }
        }

    }

    static copyRowFromBaseToNew(wsBase, wsNew, baseRow, newRow) {
        COLUMNAS_EXCEL.forEach(columna => {
            const baseCell = wsBase[`${columna}${baseRow}`];
            if (!COlUMNAS_MANTENER.includes(columna)) {
                if (columna == 'H') {
                    let text = '';
                    // console.log("Escribiendo fila ", newRow)
                    const actualValueHCell = wsNew[`H${newRow}`];
                    const BColumn = wsBase[`B${baseRow}`];
                    const EColumn = wsBase[`E${baseRow}`];
                    const HColumn = wsBase[`H${baseRow}`];
                    const GColumn = wsBase[`G${baseRow}`];
                    if(actualValueHCell){
                        text += actualValueHCell.v + ' ';
                    }
                    //Agregar la columna G de Ocupacion
                    text += 'Ya aparecio(';
                    // let text = '';
                    if (BColumn) {
                        text += BColumn.v + ' ';
                    }
                    if (EColumn) {
                        text += EColumn.v + ' ';
                    }
                    if (HColumn) {
                        // console.log(HColumn);
                        text += HColumn.w;
                    }
                    if(GColumn){
                        text += GColumn.v;
                    }
                    text += ')';
                    // console.log('Escribiendo columna ',newRow);
                    wsNew[`H${newRow}`] = {
                        v: text,
                        t: 's',
                    }
                }else if(baseCell){
                    //Hay que agregar que si en la celda antigua habia precio minimo revisarlo
                    // Revisar porque el minimo se escribe en la columna Z, pero si ya habia uno anterior se escirbe en la AA 
                    // y otro anterior en la AB.
                    this.writeCell(baseCell, wsNew, columna, newRow);
                }

            }    
            });
        // Copiar el formato de la celda si es necesario
        if (wsBase[`!cols`]) {
            wsNew[`!cols`] = wsBase[`!cols`];
        }
    }

    static writeCell(baseCell, wsNew, columna, newRow) {
        if (baseCell.t === 'd' && baseCell.w) {
            wsNew[`${columna}${newRow}`] = {
                v: baseCell.v,
                t: baseCell.t,
                w: baseCell.w,
                z: 'dd/mm/yyyy' // Mantener el formato de fecha si existe
            }
        } else {
            wsNew[`${columna}${newRow}`] = {
                v: baseCell.v,
                t: baseCell.t,
                w: baseCell.w,
            }
        }
}

    static formatDates(ws) {
        let lastRow = 6;
        // Formatear las fechas en las columnas específicas
        while (ws[`${LETRA_FECHA_DESC}${lastRow}`]) {
            const fechaDescCell = ws[`${LETRA_FECHA_DESC}${lastRow}`];
            if (fechaDescCell && fechaDescCell.t === 'd') {
                fechaDescCell.z = 'dd/mm/yyyy'; // Formato de fecha
            }
            const fechaRemCell = ws[`${LETRA_FECHA_REM}${lastRow}`];
            if (fechaRemCell && fechaRemCell.t === 'd') {
                fechaRemCell.z = 'dd/mm/yyyy'; // Formato de fecha
            }

            const percentajeCell = ws[`${LETRA_PORCENTAJE}${lastRow}`];
            if(percentajeCell){
                percentajeCell.t = 'n';
                percentajeCell.z = '0%';
            }

            lastRow++;
        }
    }


}

module.exports = CompleteExcelInfo;