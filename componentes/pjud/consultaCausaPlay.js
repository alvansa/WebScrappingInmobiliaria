// playwright
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
require('dotenv').config();

const { delay, fakeDelay, fakeDelayms } = require("../../utils/delay.js");
const ProcesarBoletin = require("../liquidaciones/procesarBoletin.js");
const PjudPdfData = require("./PjudPdfData.js");
const listUserAgents = require("../../utils/userAgents.json");
const logger = require("../../utils/logger.js");
const { stringToDate } = require('../../utils/cleanStrings.js');
const config = require('../../config.js');
const { logToRenderer } = require("../../utils/utilsRenderer.js");

const ERROR = 0;
const EXITO = 1;
const DELAY_RANGE = { min: 2, max: 5 };

const NORMAL = config.NORMAL;
const LADRILLERO = config.LADRILLERO;
const DEUDA = config.DEUDA;

const defaultUserAgents = [
    { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" },
    { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" },
];

class ConsultaCausaPjud {
    // El constructor ahora recibe solo el objeto browser de Playwright y la página inicial
    constructor(browser, caso, mainWindow, type) {
        this.browser = browser;
        this.caso = caso;
        // this.link = "https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php";
        this.link = 'https://www.pjud.cl/';
        this.page = null;          // se asignará después
        this.downloadPath = path.join(os.homedir(), "Documents", "infoRemates/pdfDownload");
        this.dirPath = "";
        this.pdfPath = "";
        this.PjudData = new PjudPdfData(this.caso, mainWindow);
        this.type = type;
    }

    async getConsulta() {
        logger.warn(`Iniciando la consulta con el archivo de refactorización (Playwright)`);
        let lineaAnterior = "";
        let result = false;

        try {
            logger.info("Iniciando la consulta de causa en Pjud...");

            await this.loadConfig();
            await this.loadPageWithRetries();

            await this.clickConsultaCausa();

            result = await this.procesarCaso(lineaAnterior);
            if (result) {
                logger.info("Caso procesado correctamente");
            } else {
                logger.info("No se pudo procesar el caso");
            }
        } catch (error) {
            logger.error(`Error en la función getConsulta: ${error.message}`);
            return false;
        } finally {
            if (this.page && !this.page.isClosed()) {
                logger.info("Cerrando página del pjud");
                await this.page.close();
            }
        }
        return true;
    }

    async clickConsultaCausa(){
        await this.page.click('div.gallery-item-info');
    }

    async loadConfig(maxRetries = 3) {
        let userAgents;
        try {
            userAgents = listUserAgents ? listUserAgents : defaultUserAgents;
        } catch (error) {
            logger.error(`Error cargando user-agents, usando defaults: ${error.message}`);
            userAgents = defaultUserAgents;
        }
        const randomIndex = Math.floor(Math.random() * userAgents.length);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Si aún no tenemos página, la creamos (contexto por defecto del browser)
                if (!this.page || this.page.isClosed()) {
                    const context = this.browser.contexts()[0] || await this.browser.newContext();
                    this.page = await context.newPage();
                }
                // await this.page.setUserAgent(userAgents[randomIndex].userAgent);
                await this.page.goto(this.link);
                return; // éxito
            } catch (error) {
                logger.error(`Error en loadConfig (intento ${attempt}): ${error.message}`);
                if (attempt === maxRetries) throw error;
                await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            }
        }
    }

    async loadPageWithRetries(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.debug(`Intento ${attempt} de carga de página...`);
                await this.page.goto(this.link, { waitUntil: "networkidle" });
                await this.page.waitForSelector("#competencia");
                return;
            } catch (error) {
                logger.error(`Error al cargar la página (intento ${attempt}): ${error.message}`);
                if (attempt === maxRetries) {
                    throw new Error(`No se pudo cargar la página después de ${maxRetries} intentos`);
                }
            }
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
        }
    }

    async procesarCaso(lineaAnterior) {
        let cambioPagina = false;

        const valorInicial = await this.setValoresIncialesBusquedaCausa();
        if (!valorInicial) {
            logger.warn("No se pudieron setear los valores iniciales");
            return false;
        }

        try {
            cambioPagina = await this.revisarPrimeraLinea(lineaAnterior);
        } catch (error) {
            logger.error(`Error al verificar la primera línea: ${error.message}`);
            return false;
        }

        if (!cambioPagina) {
            logger.warn("No se cambio el resultado. Saltando caso.");
            return false;
        }

        await this.getPartesCaso();
        const isValid = await this.searchAuctionInfo();
        if (isValid) {
            logger.debug("Datos del caso obtenidos correctamente");
            return true;
        } else {
            logger.warn("Fallo al buscar la información");
            return false;
        }
    }

    async getPartesCaso() {
        try {
            const partes = await this.page.$eval("#dtaTableDetalle tbody tr:first-child", (row) => {
                const cells = row.querySelectorAll("td");
                return cells[3] ? cells[3].innerText.trim() : "";
            });
            this.caso.partes = partes;
            return true;
        } catch (error) {
            logger.error(`Error al obtener las partes: ${error.message}`);
            return false;
        }
    }

    async revisarPrimeraLinea(lineaAnterior) {
        try {
            await this.page.waitForSelector("#btnConConsulta");
            await this.page.click("#btnConConsulta");
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            await this.page.waitForSelector("#dtaTableDetalle tbody tr:first-child", { timeout: 30000 });

            // waitForFunction con un solo argumento (objeto)
            await this.page.waitForFunction(
                ({ lineaAnterior }) => {
                    const lineaActual = document.querySelector("#dtaTableDetalle tbody tr:first-child");
                    if (lineaActual) {
                        const cells = lineaActual.querySelectorAll("td");
                        const newContent = Array.from(cells).map(cell => cell.innerText.trim()).join(" ");
                        if (newContent.includes("No se han encontrado")) {
                            return false;
                        }
                        return newContent && newContent !== lineaAnterior;
                    }
                    return false;
                },
                { timeout: 5000 },
                { lineaAnterior }
            );
            return true;
        } catch (error) {
            return false;
        }
    }

    async getPrimeraLinea() {
        return await this.page.$eval("#dtaTableDetalle tbody tr:first-child", (row) => {
            const cells = row.querySelectorAll("td");
            return Array.from(cells).map(cell => cell.innerText.trim()).join(" ");
        });
    }

    async setValoresIncialesBusquedaCausa() {
        const valores = this.validateInitialValues();
        if (!valores) {
            logger.warn(`Error al precargar valores`);
            return false;
        }
        logger.debug("Valores precargados : Listo");

        if (!(await this.configurateCompetencia())) return false;
        if (!(await this.configurateCorte(valores.corte))) return false;
        if (!(await this.configurateTribunal2(valores.juzgado))) return false;
        if (!(await this.configurateCausa(valores.causa))) return false;
        if (!(await this.configurateAnno(valores.anno))) return false;
        return true;
    }

    async configurateCompetencia() {
        try {
            await this.page.waitForSelector("#competencia");
            await this.page.selectOption("#competencia", "3");
            await this.page.waitForFunction(() => {
                const conCorte = document.querySelector("#conCorte");
                return conCorte && conCorte.options.length > 1;
            });
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        } catch (error) {
            logger.error(`Error configurando competencia: ${error.message}`);
            return false;
        }
    }

    async configurateCorte(valorCorte) {
        try {
            await this.page.selectOption("#conCorte", valorCorte);
            const valorCortePage = await this.page.$eval("#conCorte", el => el.value);
            if (valorCortePage !== valorCorte) {
                logger.warn(`No se seleccionó el corte: ${valorCorte}`);
                return false;
            }
            await this.page.waitForFunction(() => {
                const conTribunal = document.querySelector("#conTribunal");
                return conTribunal && conTribunal.options.length > 1;
            });
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        } catch (error) {
            logger.error(`Error configurando corte: ${error.message}`);
            return false;
        }
    }

    async configurateTribunal2(valorTribunal) {
        try {
            await this.page.selectOption("#conTribunal", valorTribunal);
            const valorPage = await this.page.$eval("#conTribunal", el => el.value);
            if (valorPage !== valorTribunal) {
                logger.warn(`No se seleccionó el tribunal: ${valorTribunal}`);
                return false;
            }
            await this.page.waitForFunction(() => {
                const conTipoCausa = document.querySelector("#conTipoCausa");
                return conTipoCausa && conTipoCausa.options.length > 1;
            });
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        } catch (error) {
            logger.error(`Error configurando tribunal: ${error.message}`);
            return false;
        }
    }

    async configurateCausa(valorCausa) {
        try {
            await this.page.selectOption("#conTipoCausa", "C");
            await this.page.waitForSelector("#conRolCausa");
            await this.page.type("#conRolCausa", valorCausa, { delay: Math.random() * 45 });
            const rolValue = await this.page.$eval("#conRolCausa", el => el.value);
            if (rolValue !== valorCausa) {
                logger.warn(`No se seleccionó el rol: ${valorCausa}`);
                return false;
            }
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        } catch (error) {
            logger.error(`Error configurando causa: ${error.message}`);
            return false;
        }
    }

    async configurateAnno(valorAnno) {
        try {
            await this.page.waitForSelector("#conEraCausa");
            await this.page.type("#conEraCausa", valorAnno, { delay: Math.random() * 45 });
            const annoValue = await this.page.$eval("#conEraCausa", el => el.value);
            if (annoValue !== valorAnno) {
                logger.warn(`No se seleccionó el año: ${valorAnno}`);
                return false;
            }
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        } catch (error) {
            logger.error(`Error configurando año: ${error.message}`);
            return false;
        }
    }

    async searchAuctionInfo() {
        logger.debug("Buscando datos del cuaderno");
        const findLink = await this.searchButtonAuction();
        if (!findLink) {
            logger.error("No se pudo encontrar el enlace del caso");
            return false;
        }

        const selectedCuaderno = await this.selectCuaderno();
        if (!selectedCuaderno) {
            logger.debug("No se encontró el cuaderno");
            return false;
        }

        if (this.type === LADRILLERO) {
            logger.info(`Buscando en no resueltos`);
            await this.searchInMainTable('notResolved');
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
        }

        await this.searchInMainTable();
        if (this.type === NORMAL) {
            logger.debug("Descargando demanda");
            await this.downloadDemanda();
        }
        return true;
    }

    async searchButtonAuction() {
        try {
            await this.page.waitForSelector("#verDetalle a");
            const link = await this.page.$("#verDetalle a");
            if (!link) return false;
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            await link.click();
            return true;
        } catch (error) {
            logger.error(`Error al buscar botón de remate: ${error.message}`);
            return false;
        }
    }

    async selectCuaderno() {
        const selectorCuaderno = "#selCuaderno";
        const targetOptionText = "Apremio";
        const targetOptionConcursal = "Concursal";
        let secondOption = null;
        try {
            await this.page.waitForSelector(selectorCuaderno);
            const options = await this.page.$$eval("#selCuaderno option", (opts) =>
                opts.map(opt => ({ text: opt.textContent.trim(), value: opt.value }))
            );

            let optionToSelect = options.find(opt => opt.text.includes(targetOptionText));
            if (!optionToSelect) {
                secondOption = options.find(opt => opt.text.includes(targetOptionConcursal));
                if (!secondOption) {
                    secondOption = options.find(opt => opt.text.includes("Principal"));
                }
                if (secondOption) {
                    logger.debug(`Seleccionando opción alternativa: ${secondOption.text}`);
                    await this.page.selectOption("#selCuaderno", secondOption.value);
                } else {
                    return false;
                }
            } else {
                await this.page.selectOption("#selCuaderno", optionToSelect.value);
            }

            // Verificar
            const cuadernoValue = await this.page.$eval("#selCuaderno", el => el.value);
            if (optionToSelect && cuadernoValue !== optionToSelect.value) {
                logger.warn(`No se seleccionó el cuaderno esperado`);
            } else if (secondOption && cuadernoValue !== secondOption.value) {
                logger.warn(`No se seleccionó la opción alternativa`);
                return false;
            }
            return true;
        } catch (error) {
            logger.error(`Error en selectCuaderno: ${error.message}`);
            return false;
        }
    }

    async searchInMainTable(table = 'main') {
        const selector = table === 'main' ? '#historiaCiv' : '#escritosCiv';
        await this.page.waitForSelector(selector, { timeout: 10000 });
        const rows = await this.page.$$(`${selector} .table tbody tr`);
        for (const row of rows) {
            try {
                if (table === 'main') {
                    await this.searchDataInRow(row);
                } else {
                    logger.info('Procesando fila de no resueltos');
                    await this.searchForDirectoryNotResolved(row);
                }
            } catch (error) {
                logger.error(`Error procesando fila: ${error.message}`);
            }
        }
    }

    async searchDataInRow(row) {
        let dateToday = null;
        if (this.type === DEUDA) {
            dateToday = this.caso.fechaRemate;
        } else {
            dateToday = new Date();
        }
        dateToday.setDate(dateToday.getDate() - 7);

        try {
            const [number, uselessFile, directory, dirHasLink, stage, tramite, descripcion, fecha, linkToDir] = await Promise.all([
                row.$eval("td:nth-child(1)", el => el.textContent.trim()),
                row.$eval("td:nth-child(2)", el => el.textContent.trim()),
                row.$eval("td:nth-child(3)", el => el.textContent.trim()),
                row.$eval("td:nth-child(3)", el => el.querySelector("a") !== null),
                row.$eval("td:nth-child(4)", el => el.textContent.trim()),
                row.$eval("td:nth-child(5)", el => el.textContent.trim()),
                row.$eval("td:nth-child(6)", el => el.textContent.trim()),
                row.$eval("td:nth-child(7)", el => el.textContent.trim()),
                row.$("td:nth-child(3) a")
            ]);

            if (this.type === NORMAL) {
                if (this.isTPDocument(descripcion)) {
                    this.caso.tp = `TP Folio ${number}`;
                }
                if (dirHasLink && linkToDir) {
                    await linkToDir.click();
                    await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                    await this.downloadPdfFile();
                    const xButton = await this.page.$("#modalAnexoSolicitudCivil > div > div > div.modal-header > button");
                    if (xButton) {
                        await this.page.click("#modalAnexoSolicitudCivil > div > div > div.modal-header > button");
                    }
                }
                this.checkDescription(descripcion);
            } else if (this.type === LADRILLERO) {
                if (stringToDate(fecha) >= dateToday) {
                    this.caso.hasChanged = true;
                }
            } else if (this.type === DEUDA) {
                if (descripcion.toLowerCase().includes("acta")) {
                    this.caso.hasChanged = true;
                }
            }
        } catch (error) {
            logger.error(`Error en searchDataInRow: ${error.message}`);
        }
    }

    async searchForDirectoryNotResolved(row) {
        const dateToday = new Date();
        dateToday.setDate(dateToday.getDate() - 7);
        try {
            const [number, uselessFile, date, type, lawyer] = await Promise.all([
                row.$eval('td:nth-child(1)', el => el.textContent.trim()),
                row.$eval('td:nth-child(2)', el => el.textContent.trim()),
                row.$eval('td:nth-child(3)', el => el.textContent.trim()),
                row.$eval('td:nth-child(4)', el => el.textContent.trim()),
                row.$eval('td:nth-child(5)', el => el.textContent.trim()),
            ]);
            if (stringToDate(date) >= dateToday) {
                this.caso.hasChanged = true;
            }
        } catch (error) {
            logger.error(`Error en searchForDirectoryNotResolved: ${error.message}`);
        }
    }

    checkDescription(descripcion) {
        const lowerCaseDesc = descripcion.toLowerCase();
        let PAGADO = { daCuenta: false, pagadoCredito: false };
        if (lowerCaseDesc.includes("da cuenta de pago")) PAGADO.daCuenta = true;
        if (lowerCaseDesc.includes("tiene por pagado el crédito") || lowerCaseDesc.includes("término por avenimiento")) PAGADO.pagadoCredito = true;
        if (PAGADO.daCuenta && PAGADO.pagadoCredito) this.caso.isPaid = true;
        if (lowerCaseDesc.includes("avenimiento")) this.caso.isAvenimiento = true;
    }

    async downloadPdfFile() {
        try {
            const rows = await this.page.$$("#modalAnexoSolicitudCivil > div > div > div.modal-body > div > div > div > table > tbody tr");
            for (let row of rows) {
                const [doc, fecha, reference, valuePdf] = await Promise.all([
                    row.$eval("td:nth-child(1)", el => el.textContent.trim()),
                    row.$eval("td:nth-child(2)", el => el.textContent.trim()),
                    row.$eval("td:nth-child(3)", el => el.textContent.trim()),
                    row.$eval('td:nth-child(1) form input[name="dtaDoc"]', input => input.value).catch(() => null)
                ]);
                if (this.shouldSkipDoc(reference)) continue;
                if (valuePdf && valuePdf !== "") {
                    const linkToPdf = "https://oficinajudicialvirtual.pjud.cl/ADIR_871/civil/documentos/anexoDocCivil.php?dtaDoc=" + valuePdf;
                    await this.downloadPdfFromUrl(linkToPdf);
                }
            }
        } catch (error) {
            logger.error(`Error en downloadPdfFile: ${error.message}`);
        }
    }

    shouldSkipDoc(reference) {
        const normalized = reference.toLowerCase().trim();
        const skipReferences = ["factura", "consignac", "vv", "ci", "mercurio", "hipotecario", "liquidac", "desarrollo", "identidad", "vale", "gastos", "correo", "publicac", "diario", "tasaci", "comprobante", "timbrado", "pagar", "ebook", "arancel", "garantia", "rut", "v.v.", "cedula", "mostrador", "declaraci", "boleta", "deposito", "cupon", "imagen", "c.i", "tgr", "personer", "pg", "sentencia", "mandato", "cartola", "cronograma", "contribuciones", "contrato", "medica", "policia", "transferencia", "acta", "pericial", "minuta", "cheque", "d.g.a", "dga", "lq", "portada", "estatuto"];
        const words = normalized.split(/\s+/);
        return skipReferences.some(ref => words.some(word => word.startsWith(ref)));
    }

    isTPDocument(reference) {
        const normalized = reference.toLowerCase();
        const tpRefs = [
            /informe\s*de\s*tasacion/i,
            /informe\s*tasacion/i,
            /informe\s*pericial/i,
            /Evacúa\s*informe/i,
            /Acompaña\s*informe/i,
            /informe\s*peritaje/i,
            /Tiene\s*por\s*evacuado\s*el\s*peritaje/i
        ];
        return tpRefs.some(regex => regex.test(normalized));
    }

    async downloadDemanda() {
        const linkBase = "https://oficinajudicialvirtual.pjud.cl/ADIR_871/civil/documentos/docu.php?valorEncTxtDmda=";
        try {
            await this.page.waitForSelector('#modalDetalleCivil > div > div > div.modal-body > div > div:nth-child(1) > table:nth-child(2) > tbody > tr > td:nth-child(1) > form > input[type="hidden"]');
            const value = await this.page.$eval(
                '#modalDetalleCivil > div > div > div.modal-body > div > div:nth-child(1) > table:nth-child(2) > tbody > tr > td:nth-child(1) > form > input[type="hidden"]',
                input => input.value
            );
            const linkToDownload = linkBase + value;
            await this.downloadPdfFromUrl(linkToDownload);
        } catch (error) {
            logger.error(`Error en downloadDemanda: ${error.message}`);
        }
    }

    async downloadPdfFromUrl(url) {
        try {
            const nameDir = `${this.caso.causa}_${this.caso.juzgado}`;
            const pdfName = `boletin_${Date.now()}.pdf`;
            this.dirPath = path.join(this.downloadPath, nameDir);
            this.pdfPath = path.join(this.dirPath, pdfName);

            if (!fs.existsSync(this.dirPath)) {
                fs.mkdirSync(this.dirPath, { recursive: true });
            }

            // Realizamos la petición HTTPS directamente sin intermediarios del navegador
            const response = await new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    const chunks = [];
                    res.on('data', chunk => chunks.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(chunks)));
                    res.on('error', reject);
                }).on('error', reject);
            });

            fs.writeFileSync(this.pdfPath, response);
            logger.debug(`PDF guardado en ${this.pdfPath}`);

            // Procesar el PDF con la utilidad existente
            const resultado = await ProcesarBoletin.convertPdfToText(this.pdfPath);
            if (resultado) {
                this.PjudData.processInfo(resultado);
            }
            await delay(1000);
        } catch (error) {
            logger.error(`Error descargando PDF desde URL: ${error.message}`);
        }
    }

    validateInitialValues() {
        const caso = this.caso;
        const valores = {
            corte: caso.corte,
            juzgado: caso.numeroJuzgado,
            causa: caso.getCausaPjud(),
            anno: caso.getAnnoPjud(),
        };
        for (const [clave, valor] of Object.entries(valores)) {
            if (valor === null) {
                logger.warn(`Falta valor: ${clave}`);
                return false;
            }
        }
        return valores;
    }

    // Métodos de limpieza (opcionales, se pueden conservar)
    async cleanFilesDownloaded() {
        try {
            if (fs.existsSync(this.dirPath)) {
                const files = await fs.promises.readdir(this.dirPath);
                for (const file of files) {
                    await fs.promises.unlink(path.join(this.dirPath, file));
                }
                await fs.promises.rmdir(this.dirPath);
                logger.debug(`Directorio eliminado: ${this.dirPath}`);
            }
        } catch (error) {
            logger.error(`Error limpiando archivos: ${error.message}`);
        }
    }
}

module.exports = ConsultaCausaPjud;