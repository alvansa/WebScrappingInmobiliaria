/*
El ladrillero
*/
const path = require('path');
const os = require('os');
const XLSX = require('xlsx');
const { app, BrowserWindow} = require('electron');
const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');

const { fakeDelay, delay } = require('#utils/delay.js');
const ConsultaCausaPjud = require("./consultaCausaPlay");
const CasoBuilder = require('#models/caso/casoBuilder.js');
const config = require('#config');
const { obtainCorteJuzgadoNumbers } = require('#utils/corteJuzgado.js');
const {stringToDate, convertDate,formatDateToDDMMAA} = require('#utils/cleanStrings.js')
const logger = require('#utils/logger.js')
const { logToRenderer } = require('#utils/utilsRenderer.js');
const {fixStringDate } = require('#utils/cleanStrings.js');
const listUserAgents = require('#utils/userAgents.json');
const PlaywrightManager = require('#core/scrapeAuction/services/PlaywrightManager.js');

const DELAY_RANGE = {"min": 2, "max" : 5}
let DEUDA_SEARCH = false;
const DEUDA = config.DEUDA;
const LADRILLERO = config.LADRILLERO;

const indexEstado = config.obtenerNumero('ESTADO');
const indexCausa = config.obtenerNumero('CAUSA');
const indexJuzgado = config.obtenerNumero('TRIBUNAL');
const indexComuna = config.obtenerNumero('COMUNA');
const indexRol = config.obtenerNumero('ROL');
const indexNotas = config.obtenerNumero('NOTAS');
const indexFechaRem = config.obtenerNumero('FECHA_REM');
const indexMartillero = config.obtenerNumero('MARTILLERO')
const indexMontoMinimo = config.obtenerNumero('MONTO_MINIMO');
const indexBancoDeuda = config.obtenerNumero('BANCO_DEUDA');
const indexDeudaHipotecaria = config.obtenerNumero('DEUDA_HIPOTECA');
const indexOcupacion = config.obtenerNumero('OCUPACION')

class checkFPMG {
    constructor(event, mainWindow, filePath,data) {
        this.event = event;
        this.browser = null;
        this.link = 'https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php';
        // this.link = 'https://oficinajudicialvirtual.pjud.cl/indexN.php';
        // this.link = 'https://oficinajudicialvirtual.pjud.cl/indexN.php#modalDetalleCivil';
        // this.link = 'https://www.pjud.cl/';
        this.page = null;
        this.window = null;
        this.mainWindow = mainWindow;
        this.filePath = filePath;
        this.wb = null;
        this.ws = null;
        this.casos = []
        this.data = data;
        this.sender = event.sender;
    }

    async process() {
        const startTime = new Date();
        const startTimeStr = startTime.toLocaleString('es-CL');
        logger.info(`[checkFPMG] Tiempo inicial: ${startTimeStr}`);

        try {
            this.obtainListSpreadSheet();
            obtainCorteJuzgadoNumbers(this.casos);

            console.log("casos revisados : ", this.casos.length);

            console.log('enviando el mensaje de progreso al renderer');
            this.sender.send('checkFPMG-progress', { type: 'status', message: `Obteniendo información de ${this.casos.length} casos...` });

            await this.processListDeuda(LADRILLERO);

            // //Write each cause that had changes in the last week
            this.writeChangesDeuda();

            return true;
        } finally {
            const endTime = new Date();
            const endTimeStr = endTime.toLocaleString('es-CL');
            const durationMs = endTime - startTime;
            const minutes = Math.floor(durationMs / 60000);
            const seconds = Math.floor((durationMs % 60000) / 1000);
            const durationFormatted = `${minutes} min ${seconds} seg (${(durationMs / 1000).toFixed(2)}s)`;

            logger.info(`[checkFPMG] Tiempo final: ${endTimeStr}`);
            logger.info(`[checkFPMG] Tiempo transcurrido: ${durationFormatted}`);
            logger.info("Proceso Finalizado");
        }
    }

    obtainListOfCauses() {
        this.wb = XLSX.readFile(this.filePath, { cellDates: true });
        this.ws = this.wb.Sheets[this.wb.SheetNames[0]];
        const lastWrittenRow = XLSX.utils.decode_range(this.ws['!ref']).e.r + 1;
        let lastRow = 2;
        while (lastRow <= lastWrittenRow) {
            const [causa, juzgado, fechaDesc,skipRowOutside] = this.obtainDataFromRow(lastRow);

            if(skipRowOutside){
                lastRow++;
                continue;
            }

            const casoExcel = new CasoBuilder(new Date(fechaDesc), "PJUD", config.PJUD)
                .conCausa(causa)
                .conJuzgado(juzgado)
                .construir();

            // console.log(casoExcel.causa, casoExcel.juzgado);
            this.casos.push(casoExcel)
            lastRow++;
        }
    }

    obtainDataFromRow(lastRow) {
        let skipRow = false;
        let causaNormalizada;
        const [estadoBusqueda, skip0] = this.obtainCellAndState(config.NOTAS, lastRow, skipRow);
        
        if (estadoBusqueda) {
            if (!estadoBusqueda.toLowerCase().includes('fp')) {
                skipRow = true;
            }
        } else {
            skipRow = true;
        }

        const estadoRemate = this.ws[`${config.ESTADO}${lastRow}`] ? true : false;
        if (estadoRemate) {
            skipRow = true;
        }

        const [causa, skip1] = this.obtainCellAndState(config.CAUSA, lastRow, skipRow);
        const [juzgado, skip2] = this.obtainCellAndState(config.TRIBUNAL, lastRow, skipRow)
        const [fechaRem, skip3] = this.obtainCellAndState(config.FECHA_REM, lastRow, skipRow, false);
        let [type, skip4] = this.obtainCellAndState(config.NOTAS, lastRow, skipRow);

        skipRow = skip0 || skipRow || skip1 || skip2 || skip3 || skip4;

        if(skipRow){
            return [causa, juzgado, fechaRem, skipRow];
        }
        causaNormalizada = causa;

        // Hacer que solo busque las causas que sean mayor a la fecha de hoy.
        const dateToday = new Date();
        if(fechaRem < dateToday){
            skipRow = true;
        }
        if(skipRow){
            return [causa, juzgado, fechaRem, skipRow];
        }
        console.log(`fecha remate ${typeof fechaRem} y fecha hoy ${dateToday}`)

        type = type.toLowerCase();

        if(!type.includes("fp")){
            skipRow = true;
            return [causaNormalizada, juzgado, fechaRem, skipRow];
        }

        //Normalizar el texto de la causa que puede venir modificado por alguien del excel.
        if(causa){
            causaNormalizada = causa.replace(/\(s\)/i, '').replace(/S\/I/ig, '').trim();
        }

        return [causaNormalizada, juzgado, fechaRem, skipRow];
    }

    obtainCellAndState(cell,lastRow,skipRow,convertToString = true){
        let skip = false;
        let cellValue = this.ws[`${cell}${lastRow}`];

        if(cellValue && cellValue.v) {
            if(convertToString){
                cellValue = cellValue.v.toString();
            }else{
                cellValue = cellValue.v;
            }
        }else{
            skip = true;
            cellValue = "";
        }

        skip = skip || skipRow;

        return [cellValue, skip];
    }

    obtainListSpreadSheet(){
        if(!this.data){
            return [];
        }
        let cont = 0;
        for (let line of this.data) {
            const dataLine = this.processNewRow(line);
            let causaNormalizada = null;

            //Ladrillero buscara 2 tipos de datos:
            if(dataLine.causa){
                causaNormalizada = dataLine.causa.replace(/\(s\)/i, '').replace(/S\/I/ig, '').trim();
            }
            //  1. Ladrillos
            if(this.isLadrillo(dataLine)){
                const casoExcel = new CasoBuilder(stringToDate(dataLine.fechaRem), "PJUD", config.PJUD)
                    .conCausa(causaNormalizada)
                    .conJuzgado(dataLine.juzgado)
                    .conFechaRemate(stringToDate(dataLine.fechaRem))
                    .construir();
                this.casos.push(casoExcel);
                // cont++;

            //  2. Propios
            // }else if(this.isPropio(dataLine)){
            //     const casoExcel = new CasoBuilder(stringToDate(dataLine.fechaRem), "PJUD", config.PJUD)
            //         .conCausa(causaNormalizada)
            //         .conJuzgado(dataLine.juzgado)
            //         .conPropio(true)
            //         .construir();
            //     this.casos.push(casoExcel);
            // 
            }else{
                continue;
            }

        }
        // for(let caso of this.casos){
        //     console.log(caso.causa, caso.juzgado, caso.fechaRemate);
        // }
    }

    isLadrillo(dataLine){
        // 0. revisar que estado no sea no
        if (dataLine.estado) {
            if (dataLine.estado.toLowerCase() !== '') {
                return false;
            }
        }

        // 1. revisar que ni causa ni juzgado sean nulos
        if (!dataLine.causa || !dataLine.juzgado) {
            return false;
        }
        // console.log(dataLine)
        // 2. revisar que la fecha de remate sea mayor a la fecha actual
        const dateToday = new Date();
        const fechaRemateDate = stringToDate(dataLine.fechaRem);
        if (fechaRemateDate <= dateToday) {
            return false;
        }
        // 3. revisar que las notas contengan "fp"
        if (!dataLine.notas || !dataLine.notas.toLowerCase().includes('fp')) {
            return false;
        }
        return true;
    }

    isPropio(dataLine){
        if (!dataLine.causa || !dataLine.juzgado) {
            return false;
        }
        if (dataLine.estado) {
            if (dataLine.estado.toLowerCase() === 'propio') {
                return true;
            }
        }
        return false;
    }

    processNewRow(line){
        const causa = line[indexCausa];
        const juzgado = line[indexJuzgado];
        const comuna = line[indexComuna];
        const rol = line[indexRol];
        const notas = line[indexNotas];
        const fechaRem = line[indexFechaRem];
        const estado = line[indexEstado];
        const martillero = line[indexMartillero];
        const montoMinimo = line[indexMontoMinimo];
        const bancoDeuda = line[indexBancoDeuda];
        const deudaHipotecaria = line[indexDeudaHipotecaria];
        const ocupacion = line[indexOcupacion]

        return {
            'estado': estado,
            'causa': causa,
            'juzgado': juzgado,
            'comuna': comuna,
            'rol': rol,
            'notas': notas,
            'fechaRem': fechaRem,
            'martillero': martillero,
            'montoMinimo': montoMinimo,
            'bancoDeuda': bancoDeuda,
            'deudaHipotecaria': deudaHipotecaria,
            'ocupacion': ocupacion,
        }
    }

    writeChangesDeuda(){
        if(this.casos.length == 0){
            return false;
        }
        let filasCopiadas = 0;
        const casosCambiados = this.casos.filter(caso => caso.hasChanged);

        if (casosCambiados.length === 0) {
            console.log('⚠️ No hay casos con cambios para guardar');
            // return;
        }
        console.log(`📊 Total casos cambiados: ${casosCambiados.length}`);

        const nuevosDatos = [];

        const headers = ['Estado','Fecha Remate','Causa','Juzgado','Monto Minimo','Banco Deuda','Deuda Hipotecaria'];
        nuevosDatos.push(headers);

        for(let caso of casosCambiados){
            const filaData = [];

            if(caso.propio){
                filaData.push('CAMBIO PROPIO'); // Columna A
            }else{
                filaData.push('CAMBIO'); // Columna A
            }
            filaData.push(formatDateToDDMMAA(caso.fechaRemate));
            filaData.push(caso.causa); 
            filaData.push(caso.juzgado);
            filaData.push(caso.montoMinimo);
            filaData.push(caso.bancoDeuda);
            filaData.push(caso.deudaHipotecaria);

            // Agregar la fila a los nuevos datos
            nuevosDatos.push(filaData);
            filasCopiadas++;

            console.log(`✅ Copiada fila ${filasCopiadas}: ${caso.causa} - ${caso.juzgado}`);
        }

        // 8. Crear el nuevo Worksheet solo con filas cambiadas
        const nuevoWs = XLSX.utils.aoa_to_sheet(nuevosDatos);
        // 9. Crear nuevo Workbook
        const nuevoWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(nuevoWb, nuevoWs, 'Casos Modificados');
        this.cambiarAnchoColumnas(nuevoWs);

        // 10. Guardar en el escritorio
        const desktopPath = getDesktopPath();
        const fecha = formatDateToDDMMAA(new Date());
        let nombreArchivo = `Ladrillero_${fecha}.xlsx`;
        if(DEUDA_SEARCH){
            nombreArchivo = `Deuda_${fecha}.xlsx`

        }
        const rutaCompleta = path.join(desktopPath, nombreArchivo);

        XLSX.writeFile(nuevoWb, rutaCompleta);

        console.log('\n========================================');
        console.log(`✅ ARCHIVO CREADO EXITOSAMENTE`);
        console.log(`📁 Ubicación: ${rutaCompleta}`);
        console.log(`📋 Total filas guardadas: ${filasCopiadas}`);
        console.log('========================================\n');
    }

    cambiarAnchoColumnas(ws) {
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

    //TODO: agregar que se ocupe efectivamente la fecha limite
    async proccesDeudaSeguir(fechaLimite){
        // return true;
        this.obtainListDeuda();
        if(this.casos.length == 0){
            console.log('No hay casos de deuda para procesar');
            return false;
        }
        console.log(`Se encontraron ${this.casos.length} casos de deuda para procesar`);
        let cont = 0;
        for(let caso of this.casos){
            console.log(caso.causa, caso.juzgado, caso.fechaRemate);
            cont++;
            if(cont > 5){
                break;
            }
        }

        obtainCorteJuzgadoNumbers(this.casos)

        //TODO: Ocupar el GestorRematesPjud
        DEUDA_SEARCH = true;
        await this.processListDeuda(DEUDA);

        this.writeChangesDeuda();

        console.log('Proceso de deuda listo')
        return true;
    }

    obtainListDeuda(){
        if(!this.data){
            logger.warn('No se pudo recuperar la data')
            return;
        }
        for (let line of this.data) {
            const dataLine = this.processNewRow(line);
            let causaNormalizada = null;

            if(dataLine.causa){
                causaNormalizada = dataLine.causa.replace(/\(s\)/i, '').replace(/S\/I/ig, '').trim();
            }
            // Busqueda de deuda
            if(this.isDeuda(dataLine)){
                const fechaRemateDate = stringToDate(dataLine.fechaRem);
                const casoExcel = new CasoBuilder(stringToDate(dataLine.fechaRem), "PJUD", config.PJUD)
                    .conCausa(causaNormalizada)
                    .conJuzgado(dataLine.juzgado)
                    .conFechaRemate(fechaRemateDate)
                    .construir();

                this.casos.push(casoExcel);
            }else{
                continue;
            }

        }
        // for(let caso of this.casos){
        //     console.log(caso.causa, caso.juzgado, caso.fechaRemate);
        // }
    }

    isDeuda(dataLine){
        //Revisa si el remate fue catalogado como seguir
        if (!dataLine.estado.toLowerCase().includes('seguir')) {
            return false;
        }
        //revisar que ni causa ni juzgado sean nulos
        if (!dataLine.causa || !dataLine.juzgado) {
            return false;
        }
        // 2. revisar que la fecha de remate sea mayor a la fecha actual
        //FECHA limite de deuda
        const fechaLimite = new Date('2026/06/28');
        const fechaRemateDate = stringToDate(dataLine.fechaRem);

        if(fechaRemateDate < fechaLimite  ){
            return false;
        }
        if(this.searchDeudaInColumn(dataLine)){
            return true;
        }
        return false;
    }

    searchDeudaInColumn(line){
        const martillero = line.martillero.toLowerCase();
        const ocupacion = line.ocupacion.toLowerCase();
        // Notas era el nombre de la columna que ahora tenemos como VV
        const notas = line.notas.toLowerCase();
        if(martillero && martillero.includes('deuda')){
            return true;
        }
        if(ocupacion && ocupacion.includes('deuda')){
            return true;
        }
        if(notas && notas.includes('deuda')){
            return true;
        }
        return false;
    }

    async processListDeuda(type) {
        const mainWindow = BrowserWindow.fromWebContents(this.event.sender);
        let counter = 0;
        for (let caso of this.casos) {
            counter++;
            logger.info(`Revisando caso ${counter} de ${this.casos.length}`);
            logger.debug(`Causa: ${caso.causa}, Juzgado: ${caso.juzgado}, Fecha Remate: ${caso.fechaRemate}`);
            logToRenderer(this.mainWindow, `Revisando caso ${counter} de ${this.casos.length} ${caso.causa} y ${caso.juzgado}`);
            const percentage = Math.floor((counter / this.casos.length) * 100);
            if (!caso.numeroJuzgado || !caso.corte) {
                continue;
            }
            await this.consultaCausaGeneral(caso, type);
            // if(counter > 2){
            //     throw Error;
            // }
            // if (counter > 8) {
            //     logger.info(`Terminadno el ladrillero por ser mayor de 10`)
            //     return true;
            // }

            if ((counter + 1) < this.casos.length) {
                const awaitTime = Math.random() * (90 - 30) + 30; // Genera un número aleatorio entre 30 y 90
                mainWindow.webContents.send('aviso-espera', [awaitTime, counter + 1, this.casos.length]);
                await delay(awaitTime * 1000);
            }
            this.sender.send('checkFPMG-progress', { type: 'progress', percentage: percentage, message: `Trabajando` });
        }
    }
    async consultaCausaGeneral(caso,type){
        try{
            const consultaCausa = new ConsultaCausaPjud(PlaywrightManager, caso, this.mainWindow, type);
            const result = await consultaCausa.getConsulta()
            return result;
        }catch(error){
            logger.error(`Error en consultaCausaGeneral ${error.message}`);
        }
    }
}



function copyRowBetweenFiles(sourceSheet, targetSheet, sourceRowIndex, targetRowIndex) {
    const sourceData = XLSX.utils.sheet_to_json(sourceSheet, { header: 1 });
    
    const rowToCopy = sourceData[sourceRowIndex];
    
    for (let col = 0; col < rowToCopy.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: targetRowIndex, c: col });
        targetSheet[cellAddress] = { v: rowToCopy[col], t: typeof rowToCopy[col] };
    }
    
    console.log(`✅ Fila ${sourceRowIndex + 1} copiada a fila ${targetRowIndex + 1}`);
}

function getDesktopPath(){
    // Para diferentes sistemas operativos
    const homeDir = os.homedir();
    
    // Windows
    if (process.platform === 'win32') {
        return path.join(homeDir, 'Desktop');
    }
    // macOS
    else if (process.platform === 'darwin') {
        return path.join(homeDir, 'Desktop');
    }
    // Linux/Unix
    else {
        return path.join(homeDir, 'Desktop');
    }
}

module.exports = checkFPMG;