const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");
const os = require("os");

const {delay} = require('../../utils/delay');
const Caso  = require('../caso/caso');

const EXITO = 1;
const ERROR = 0;
const REINTENTAR = 2;
const DETENER = 3;
const CONTINUAR = 4;

const LIQUIDACIONES = 3;
class BoletinConcursal {
    constructor(browser,page) {
        this.browser = browser;
        this.page = page;

    }

    async getDatosBoletin(startDate, endDate, casos, fechaHoy) {
        const downloadedFiles = [];
        const intentosMax = 1;
        let stopFlag = false;
        let tienePaginaSiguiente = true;
        // Configura el directorio para guardar descargas
        // Configurar la ruta de descarga
        const downloadPath = path.join(os.homedir(), "Documents", "InfoRemates/pdfDownload");

        // Asegurarte de que la carpeta exista
        if (!fs.existsSync(downloadPath)) {
            fs.mkdirSync(downloadPath, { recursive: true });
        }

        try {

            const client = await this.page.target().createCDPSession()
            // Configura la carpeta de descargas
            await client.send("Page.setDownloadBehavior", {
                behavior: "allow",
                downloadPath: downloadPath,
            });

            // Navega a la página web
            // await this.page.goto("https://www.boletinconcursal.cl/boletin/remates", { waitUntil: "networkidle2" });

            while (tienePaginaSiguiente && !stopFlag) {
                let firstRowContent = await this.getPrimeraLinea();
                stopFlag = await this.getTableData(startDate, endDate, stopFlag, downloadPath, casos, fechaHoy, downloadedFiles, intentosMax);

                tienePaginaSiguiente = await this.manejarPaginaSiguiente(firstRowContent);
            }
        } catch (error) {
            console.error("Error al obtener los datos:", error);
        }
    };
    async getPrimeraLinea() {
        const primeraLinea = await this.page.$eval('#tblRematesInmuebles tbody tr:first-child', (row) => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
        });
        return primeraLinea;
    }
    async getTableData(fechaInicio, fechaFin, stopFlag, downloadPath, casos, fechaHoy, downloadedFiles, maxRetries = 3) {
        try {
            //Espera a que la tabla esté presente
            await this.page.waitForSelector("#tblRematesInmuebles", { timeout: 10000 });

            //Obtiene las filas de la tabla
            const rows = await this.page.$$('#tblRematesInmuebles tbody tr');

            for (const row of rows) {
                let success = ERROR; // Revisa si la fila se procesó correctamente
                let attempts = 0;    // Contador de intentos

                while (success != EXITO && attempts < maxRetries) {
                    try {
                        attempts++;
                        success = await this.procesarFila(row, fechaInicio, fechaFin, downloadPath, downloadedFiles, casos, fechaHoy);
                    } catch (error) {
                        console.error(`Error processing row on attempt ${attempts}: ${error.message}`);
                        if (attempts >= maxRetries) {
                            console.warn(`Max retries reached for a row. Skipping it.`);
                        }
                    }

                    // Agrega un pequeño retraso entre intentos para evitar sobrecargar el servidor
                    if (success === REINTENTAR) {
                        await delay(200);
                    }
                    if (success === CONTINUAR) {
                        break;
                    }

                }
                if (success === DETENER) {
                    stopFlag = true;
                }
            }
        } catch (error) {
            console.error(`General error processing the table: ${error.message}`);
        }

        return stopFlag;
    }
    async procesarFila(row, fechaInicio, fechaFin, downloadPath, downloadedFiles, casos, fechaHoy) {
        // Extrae la informacion de la fila
        const [nombreCell, dateCell, martillero] = await Promise.all([
            row.$eval('td:nth-child(1)', el => el.textContent.trim()),
            row.$eval('td:nth-child(2)', el => el.textContent.trim()),
            row.$eval('td:nth-child(3)', el => el.textContent.trim()),
        ]);

        const fileDate = new Date(parseDate(dateCell));

        // Revisa el rango
        if (fileDate < fechaInicio) {
            return DETENER;
        }

        if (isbetweenDates(fileDate, fechaInicio, fechaFin)) {
            const button = await row.$('svg');
            if (!button) {
                return REINTENTAR;
            }
            await button.click();
            // Espera hasta descargar el archivo
            const downloadedFile = await this.waitForNewFile(downloadPath, downloadedFiles);
            downloadedFiles.push(downloadedFile);

            // Crea y guarda el caso
            const caso = new Caso(fechaHoy, fileDate, downloadedFile, LIQUIDACIONES);
            caso.martillero = martillero ;
            casos.push(caso);
            return EXITO;
        } else {
            return CONTINUAR;
        }
    }

    async manejarPaginaSiguiente(firstRowContent) {
        // Busca si existe un botón de 'Siguiente'
        console.log("Buscando si existe siguiente.");
        const nextButton = await this.page.$('#tblRematesInmuebles_next');
        if (nextButton) {
            await nextButton.click();

            // Wait for the table to update after clicking the next button
            await this.page.waitForFunction(
                (initialContent) => {
                    const firstRow = document.querySelector('#tblRematesInmuebles tbody tr:first-child');
                    if (firstRow) {
                        const cells = firstRow.querySelectorAll('td');
                        const newContent = Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
                        return newContent !== initialContent;
                    }
                    return false;
                },
                { timeout: 3000 },
                firstRowContent
            );

            return true; // Continue to the next page
        } else {
            console.log("No hay más páginas.");
            return false; // No next page, stop
        }
    }

    async waitForNewFile(downloadPath, initialFiles) {
        return new Promise((resolve, reject) => {
            const initialFileSet = new Set(initialFiles); // Convierte initialFiles a Set para mejor rendimiento

            const interval = setInterval(() => {
                let currentFiles;
                try {
                    // Lee el directorio actual
                    currentFiles = new Set(fs.readdirSync(downloadPath));
                } catch (error) {
                    clearInterval(interval);
                    reject(new Error(`Error al leer el directorio: ${error.message}`));
                    return;
                }

                // Encuentra archivos nuevos que no estaban en initialFiles y que no se llamen "DS_Store"
                const newFiles = [...currentFiles].filter(file => !initialFileSet.has(file) && !file.includes("DS_Store"));
                if (newFiles.length > 0) {
                    // Si encuentra un archivo que no termina con ".crdownload", lo considera completo
                    const completeFile = newFiles.find(file => !file.endsWith('.crdownload'));
                    if (completeFile) {
                        clearInterval(interval); // Detén el intervalo
                        resolve(completeFile); // Devuelve el nombre del archivo completo
                    }
                }
            }, 100);

            // Tiempo límite para evitar bloqueos
            const timeout = setTimeout(() => {
                clearInterval(interval); // Asegura detener el intervalo si no se encuentra un archivo
                reject(new Error('Tiempo de espera excedido para un archivo nuevo.'));
            }, 8000); // 5 segundos por intento
        });
    }
}


function parseDate(dateString) {
    const [day, month, year] = dateString.split('-');
    return new Date(`${year}/${month}/${day}`);
}
function isbetweenDates(date, startDate, endDate) {
    date.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return date >= startDate && date <= endDate;
}


module.exports = BoletinConcursal;
