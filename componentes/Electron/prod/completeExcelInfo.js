const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const Caso = require('../../caso/caso');
const CasoBuilder = require('../../caso/casoBuilder');
const GestorRematesPjud = require('../../pjud/GestorRematesPjud.js');
const {writeLine,insertarCasoIntoWorksheet,createExcel} = require('../../excel/createExcel')
const {tribunalesPorCorte, obtainCorteJuzgadoNumbers} = require('../../../utils/corteJuzgado.js');
const {stringToDate} = require('../../../utils/cleanStrings.js');   
const config = require('../../../config.js');
const { type } = require('os');
const { NormalModuleReplacementPlugin } = require('webpack');
const PJUD = config.PJUD;
const EMOL = config.EMOL;
const LIQUIDACIONES = config.LIQUIDACIONES;

const LETRA_FECHA_DESC = 'C';
const LETRA_ORIGEN = 'D';
const LETRA_FECHA_REM = 'F';
const LETRA_CAUSA = 'J';
const LETRA_JUZGADO = 'K';
const LETRA_PARTES = 'O';

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
        let lastRowBase = 6;
        const wbNew = XLSX.readFile(excelNuevo, {cellDates: true});
        const wsNew = wbNew.Sheets[wbNew.SheetNames[0]];
        let lastRowNew = 6;
        const causasToSearch = new Set();   
        const findedCausas = [];
        while(wsNew[`${LETRA_CAUSA}${lastRowNew}`]){
            const causa = wsNew[`${LETRA_CAUSA}${lastRowNew}`].v.toLowerCase().replace(/\s*/g,'');
            causasToSearch.add(causa);
            lastRowBase = 2;
            while(wsBase[`${LETRA_FECHA_REM}${lastRowBase}`]){
                const cellCausa = wsBase[`${LETRA_CAUSA}${lastRowBase}`];
                // console.log(`Revisando fila ${lastRowBase} del archivo base`)
                if(!cellCausa ||typeof cellCausa.v != 'string'){
                    lastRowBase++;
                    continue;
                }
                const causaBase = cellCausa.v.toLowerCase().replace(/\s*/g,'');;

                if(causa == causaBase){
                    console.log(`Causa repetida: ${causa} fila base: ${lastRowBase} fila nueva: ${lastRowNew}`);
                    findedCausas.push({causa: causa,linea: lastRowBase});
                }
                lastRowBase++;
            }
            lastRowNew++;
        }


        console.log(`Causas a buscar: ${causasToSearch.size}`);
        lastRowNew = lastRowNew + 5;
        findedCausas.forEach(causa => {
            console.log(`Causa: ${causa.causa} encontrada en la fila: ${causa.linea}`);
            //copiar la fila x en la hoja de excel nueva
            const newCausaCell = wsNew[`${LETRA_CAUSA}${lastRowNew}`];
            if(newCausaCell){
                newCausaCell.v = causa.causa;
            }else{
                wsNew[`${LETRA_CAUSA}${lastRowNew}`] = {v: causa.causa};
            }   
            lastRowNew++;
        });
        createExcel.cambiarAnchoColumnas(wsNew);
        wsNew['!ref'] = 'A5:AQ' + lastRowNew;
        const fileName = excelNuevo.split('.')[0];
        const filePath = fileName+'Completo'+'.xlsx';
        XLSX.writeFile(wbNew,filePath, { cellDates: true });
    }
}

module.exports = CompleteExcelInfo;