const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const Caso = require('../../caso/caso');
const CasoBuilder = require('../../caso/casoBuilder');
const GestorRematesPjud = require('../../pjud/GestorRematesPjud.js');
const {writeLine,insertarCasoIntoWorksheet} = require('../../excel/createExcel')
const {tribunalesPorCorte, obtainCorteJuzgadoNumbers} = require('../../../utils/corteJuzgado.js');


class CompleteExcelInfo{
    constructor(filePath,event,mainWindow){
        this.filePath = filePath;
        this.mainWindow = mainWindow;
        this.event = event;
        this.casos = [];
    }

    async fillData(){
        const wb = XLSX.readFile(this.filePath);
        const ws = wb.Sheets['Remates'];
        let lastRow = 6;


        // Obtain de auctions
        while(ws[`I${lastRow}`]){
            const celda = ws[`I${lastRow}`];
            const causa = ws[`I${lastRow}`].v;
            const juzgado = ws[`J${lastRow}`].v
            const celdaPartes = ws[`N${lastRow}`]
            let partes = null;
            if(celdaPartes){
                partes = celdaPartes.v;

            }
            const casoExcel = new CasoBuilder(new Date())
                .conExcel(causa,juzgado,partes)
                .construir();

            console.log(causa);
            if(!casoExcel.partes){
                this.casos.push(casoExcel)
            }

            lastRow++;
        }

        console.log(`Casos a buscar: ${this.casos.length}`);
        if(this.casos.length == 0){
            return true;
        }

        this.casos[0].partes = "TEST REAL";
        // Process de auctions
        await this.obtainNewData()


        // Write the new data
        this.writeData(ws);
        console.log(this.casos.map(obj => obj.toObject()));

        ws['!ref'] = 'A5:AP' + lastRow;
        const fileName = this.filePath.split('.')[0];
        const filePath = fileName+'Completo'+'.xlsx';
        XLSX.writeFile(wb, this.filePath, { cellDates: true });
        return filePath;
    }

    async obtainNewData(){
        obtainCorteJuzgadoNumbers(this.casos);
        const gestorRemates = new GestorRematesPjud(this.casos,this.event,this.mainWindow);
        const result = await gestorRemates.getInfoFromAuctions();

        return true;
    }

    writeData(ws) {

        for (let caso of this.casos) {
            const actualCausa = caso.causa;
            let lastRow = 6;
            while (ws[`I${lastRow}`]) {
                const celda = ws[`I${lastRow}`];
                const causaExcel = celda.v;
                if(actualCausa == causaExcel){
                    insertarCasoIntoWorksheet(caso,ws,lastRow)
                }
                lastRow++;
            }
        }
    }

}

module.exports = CompleteExcelInfo;