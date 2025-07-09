const fs = require('fs');
const path = require('path');
const PDFParser = require( 'pdf2json' );
const pdf = require('pdf-parse');
const os = require('os');
const FormData = require('form-data');
const axios = require('axios');

const Caso = require('../caso/caso.js');
const { comunas, tribunales2 } = require('../caso/datosLocales.js');
const BoletinConcursal = require('./getBoletinConcursal.js');
const { delay } = require('../../utils/delay.js');

const PJUD = 2;


class ProcesarBoletin {
    constructor(browser,page) {
        this.browser = browser;
        this.page = page;
        this.downloadPath = path.join(os.homedir(), "Documents", "infoRemates/pdfDownload");
    }
    obtainDataRematesPdf(data, caso) {
        if (!caso) {
            console.error("No se ha recibido caso");
            return;
        }
        const normalizedData = this.normalizeData(data);
        console.log("Texto normalizado: ", normalizedData);

        const fechaRemate = this.getfechaRemate(normalizedData);
        const causa = this.getCausa(normalizedData);
        const juzgado = this.getJuzgado(data);
        const comuna = this.getComuna(data);
        const monto = this.montoMinimo(normalizedData);
        const anno = this.getAnno(normalizedData);
        const direccion = this.getDireccion(normalizedData);
        const tipoPropiedad = this.getTipoPropiedad(normalizedData);
        const tipoDerecho = this.getTipoDerecho(normalizedData);

        if (fechaRemate) {
            caso.fechaRemate = fechaRemate;
        }
        if (causa) {
            caso.causa = causa[0];
        }
        if (juzgado) {
            // const juzgado = tribunal[0].split(":")[1];
            caso.juzgado = juzgado;
        }
        if (comuna) {
            // const comunaStr = comuna[0].split(":")[1];
            caso.comuna = comuna;
        }
        if (monto) {
            // const montoMinimo = monto[0].match(/\d+/g);
            caso.montoMinimo = monto[1] ;
        }
        if (anno) {
            const annoNumero = anno[0].match(/\d+/g)[0];
            caso.anno = annoNumero;
        }
        if (direccion) {
            caso.direccion = direccion;
        }
        if (tipoPropiedad) {
            caso.tipoPropiedad = tipoPropiedad[0];
        }
        if (tipoDerecho) {
            caso.tipoDerecho = tipoDerecho[0];
        }

    }

    async getPdfData(fechaInicio, fechaFin, fechaHoy) {
        await delay(2000);
        let casos = [];
        let texto = "";
        try {
            const boletin = new BoletinConcursal(this.browser,this.page);
            await boletin.getDatosBoletin(fechaInicio, fechaFin, casos, fechaHoy);
            const pdfs = fs.readdirSync(this.downloadPath);
            for (let pdf of pdfs) {
                const pdfFile = path.join(this.downloadPath, pdf);
                if (fs.existsSync(pdfFile)) {
                    console.log("Procesando pdf: ", pdf," con path: ",pdfFile);
                    // Aqui se envian los pdf a el proceso principal para ser convertidos a texto y poder trabajar con ellos.
                    try{
                        texto = await ProcesarBoletin.convertPdfToText2(pdfFile);
                        const caso = this.getCaso(pdf, casos);
                        this.obtainDataRematesPdf(texto, caso);
                    }catch(error){
                        console.log("Error en convertir el pdf a texto",error);
                        continue;
                    }
                }
            }
        } catch (error) {
            console.error("Error en getPdfData:", error);
        } finally {
            this.deleteFiles();
            return casos;
        }
    }


    deleteFiles() {
        console.log("Eliminando archivos");
        // const downloadPath = path.join(os.homedir(), "Documents", "infoRemates/pdfDownload");
        fs.readdir(this.downloadPath, (err, files) => {
            if (err) {
                console.error("Error al leer el directorio:", err);
                return;
            }
            for (const file of files) {
                fs.unlink(path.join(this.downloadPath, file), (err) => {
                    if (err) {
                        console.error("Error al eliminar el archivo:", err);
                        return;
                    }
                });
            }
        });
        console.log("Archivos eliminados");
    }


    getCaso(pdf, casos) {
        for (let caso of casos) {
            if (caso.link.toLowerCase() === pdf.toLowerCase()) {
                return caso;
            }
        }
    }

    getfechaRemate(texto) {
        const regex = /(\d{2}\/\d{2}\/\d{4})/g;
        let fecha = texto.match(regex);

        if (fecha) {
            fecha = this.parseDate(fecha[0]);
            return fecha;
        }
        return null;
    }
    getCausa(texto) {
        const regex = /C-\d{1,7}-\d{4}/gi;
        let causa = texto.match(regex);

        return causa;
    }

    getJuzgado(texto) {
        texto = texto.toLowerCase();
        const indexTribunal = texto.indexOf("tribunal:");
        const indexDeudor = texto.indexOf("deudor:");
        if (indexTribunal === -1 || indexDeudor === -1 || indexTribunal > indexDeudor) {
            console.error("No se encontró el tribunal o el deudor en el texto.");
            return null;
        }
        let juzgado = texto.slice(indexTribunal + 9, indexDeudor);
        return juzgado;
    }


    parseDate(dateString) {
        const [day, month, year] = dateString.split('/');
        return `${year}/${month}/${day}`;
    }

    montoMinimo(texto) {
        console.log("Texto: ", texto);
        const reMonto = /Valor\s*Minimo\s*\(pesos\):\s*(\d{7,13}|\d{1,3}(\.\d{1,3})*)/i;
        let monto = texto.match(reMonto);
        return monto;
    }

    getComuna(texto) {
        const foundComunas = [];
        const indexInicio = texto.indexOf("Detalle");
        texto = texto.slice(indexInicio);
        texto = texto.toLowerCase();
        for (let comuna of comunas) {
            const comunaMinuscula = comuna.toLowerCase();
            if (texto.includes(comuna) || texto.includes(comunaMinuscula)) {
                foundComunas.push(comunaMinuscula);
            }
        }
        for(let comuna of foundComunas){
            const findComuna = 'comuna de ' + comuna;
            if(texto.includes(findComuna)){
                return comuna;
            }
        }
        if(comunas.length > 0){
            const comuna = foundComunas[0];
            return comuna;
        }
        return null;
    }
    getAnno(data) {
        const detalle = 'detalle';
        const detalleIndex = data.indexOf(detalle);
        if (detalleIndex === -1) {
            return null;
        }
        let dataAnno = data.slice(detalleIndex);
        const regexAnno = /(?:ano)\s*(\d{4})/i;
        const anno = dataAnno.match(regexAnno);
        if (anno) {
            return anno;
        }
        const indexFecha = dataAnno.indexOf('fecha');
        const dataFecha = dataAnno.slice(indexFecha);
        const regexFecha = /(\d{4})/g;
        const fecha = dataFecha.match(regexFecha);
        if (fecha) {
            return fecha;
        }
        return null;
    }

    getDireccion(data) {
        let dataMinuscula = data.toLowerCase();
        const detalle = 'detalle';
        const detalleIndex = dataMinuscula.indexOf(detalle);
        const tipoBienes = 'tipo bienes';
        const tipoBienesIndex = dataMinuscula.indexOf(tipoBienes);
        if (detalleIndex === -1 || tipoBienesIndex === -1) {
            return null;
        }
        dataMinuscula = dataMinuscula.slice(detalleIndex, tipoBienesIndex);
        dataMinuscula = dataMinuscula.replace(/[\r\n]+/g, ' ');
        const palabrasClave = ['propiedad', 'inmueble', 'departamento', 'casa'];
        const comuna = 'comuna';
        const direcciones = [];
        for (let palabra of palabrasClave) {
            const index = dataMinuscula.indexOf(palabra);
            let fin = dataMinuscula.indexOf(comuna);
            if (index == -1) { continue; }
            // revisar si hay una palabra comuna para finalizar la direccion
            if (fin > index) {
                const direccion = dataMinuscula.substring(index, fin);
                return direccion;
            }
        }
        if (direcciones.length > 0) {
            return direcciones.at(-1);
        }
        return dataMinuscula;

    }

    getTipoPropiedad(data) {
        const regexPropiedad = /(?:casa|departamento|terreno|parcela|sitio|local|bodega|oficina|vivienda)/i;
        const tipoPropiedad = data.match(regexPropiedad);
        return tipoPropiedad;
    }

    getTipoDerecho(data) {
        const regexDerecho = /(?:posesión|usufructo|nuda propiedad|bien familiar)/i;
        const tipoDerecho = data.match(regexDerecho);
        return tipoDerecho;
    }

    normalizeData(data) {
        const newData = data
        .toLowerCase()
        // .replace(/[,.\n]/g, ' ')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/, ' ');
        return newData;
    }

    static async convertPdfToText(filePath) {
        return new Promise((resolve, reject) => {
            const pdfParser = new PDFParser(this,1);

            pdfParser.on('pdfParser_dataError', errData => {
                console.error('Error al procesar PDF:', errData.parserError);
                reject(errData.parserError);
            });

            pdfParser.on('pdfParser_dataReady', pdfData => {
                console.log('PDF procesado exitosamente.');
                resolve(pdfParser.getRawTextContent());
            });

            try {
                pdfParser.loadPDF(filePath);
            } catch (error) {
                console.error('Error al cargar el archivo PDF:', error);
                reject(error);
            }
        });
    }

    static async convertPdfToText2(filePath, origen=1){
        try {
            // if(origen == PJUD){
            //     const tesseractText = await ProcesarBoletin.processWithTesseract(filePath);
            //     console.log("procesado con tesseract :) :");

            //     return tesseractText;
            // }else{
                console.log("leyendo con simple pdf-parse");

                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdf(dataBuffer);
                console.log(data.text);
                return data.text;
            // }
        } catch (error) {
            console.error('Error al procesar PDF:', error.message);
            return null;
        }
    }

    static async processWithTesseract(filePath){
        console.log(filePath);
        try{
            const form = new FormData();
            form.append("file", fs.createReadStream(filePath));

            const headers = {
                ...form.getHeaders(),
            }

            const response = await axios.post('http://localhost:8000/processPDF', form, {
                headers: headers,
                responseType: 'json',
            });

            const normalizedResponse = normalizeResponse(response.data);
            return normalizedResponse;
        }catch(error){
            console.error(`Ocurrio un error procesando el pdf con tesseract: ${error.message}`);
            return null;
        }
    }


}

function normalizeResponse(data){
    let finalText = "";
    for (let page of data['pages']) {
        const text = page.text
            .replace(/(\r\n|\n|\r)/gm, " ")
            .replace(/\s+/g, " ")
            .trim();

        finalText += text + " ";
    }
    return finalText.trim();
}

module.exports = ProcesarBoletin