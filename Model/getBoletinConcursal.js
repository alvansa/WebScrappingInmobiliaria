const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

async function getDatosBoletin (){
  // Configura el directorio para guardar descargas
  const downloadPath = path.resolve(__dirname, "downloads");

  // Lanza el navegador
  const browser = await puppeteer.launch({
    headless: false, // Cambia a true para ocultar el navegador
    // args: ['--start-maximized'],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  const client = await page.target().createCDPSession()
  // Configura la carpeta de descargas
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  // Navega a la página web
  await page.goto("https://www.boletinconcursal.cl/boletin/remates", { waitUntil: "networkidle2" });

  // Busca el elemento SVG y haz clic en él
  await page.waitForSelector("#tblRematesInmuebles"); // Ajusta el selector según tu caso
  const svgElements = await page.$$('#tblRematesInmuebles svg');
  for (let svgElement of svgElements) {
    await svgElement.click();
    await delay(100);
    }
//   const datos = await getTableData(page);

//   console.log("Archivo descargado en:", datos);

  // Cierra el navegador
  await browser.close();
  deleteFiles();
};

function deleteFiles() {

  const downloadPath = path.resolve(__dirname, "downloads");
  fs.readdir(downloadPath, (err, files) => {
      if (err) {
          console.error("Error al leer el directorio:", err);
          return;
      }
      for (const file of files) {
          fs.unlink(path.join(downloadPath, file), (err) => {
              if (err) {
                  console.error("Error al eliminar el archivo:", err);
                  return;
              }
              console.log("Archivo eliminado:", file);
          });
      }
  });
}


async function getTableData(page) {
    console.log("Entrando a getTableData");

    const tableData = await page.evaluate(async (page) => {
        const rows = Array.from(document.querySelectorAll('#tblRematesInmuebles tr')); // Get all rows in tbody
        console.log("rows: ", rows);

        const data = [];
        for (const row of rows) {
            const columns = Array.from(row.querySelectorAll('td')); // Get all columns in the row

            // Extract the 'onclick' attribute of the <svg> in the 4th column (documento)
            let svgOnClick = '';
            const svgElement = columns[3] ? columns[3].querySelector('svg') : null;
            if (svgElement && svgElement.hasAttribute('onclick')) {
                svgOnClick = svgElement.getAttribute('onclick');
            }

            // Push the row data
            data.push({
                nombre: columns[0] ? columns[0].innerText.trim() : '',
                fecha: columns[1] ? columns[1].innerText.trim() : '',
                martillero: columns[2] ? columns[2].innerText.trim() : '',
                documento: svgOnClick || (columns[3] ? columns[3].innerText.trim() : ''),
            });

            // Trigger the SVG click function (download)
            // if (svgElement && svgOnClick) {
            //     await page.click("svg");
            // }
        }

        return data;
    });

    return tableData;
}


function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }


module.exports = { getDatosBoletin };