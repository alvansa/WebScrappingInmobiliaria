const { timeout } = require('puppeteer');
const puppeteer = require('puppeteer');
const { ipcRenderer } = require('electron');
const { load } = require('cheerio');
const config =  require("../../config.js");

const ERROR = 0;
const EXITO = 1;
async function getConsultaCausaPjud(tablaRemates){
    let lineaAnterior = '';
    let numeroCaso = 0;
    let valorInicial = false;
    let remates = new Set();
    const browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();
    const link = 'https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php'
    await loadPageWithRetries(page, link);
    console.log('Página cargada: ',tablaRemates);
    try{
        for (let [index, caso] of tablaRemates.entries()) {
            if(index % 25 === 0){
                await loadPageWithRetries(page, link);
            }
            console.log('Intentando caso:', index + 1, caso.causa);
            lineaAnterior = await procesarCaso(page,caso, index + 1,lineaAnterior,remates); // Procesa cada caso individualmente
            console.log('Intentando caso:', index + 1, caso.causa);
            // ipcRenderer.invoke('update-progress', { progreso: index + 1, caso: caso.causa });
        }
        console.log('Checkpoint 5');
        await delay(5000);
        await browser.close();
        return tablaRemates;
    }catch(error){
        console.error('Error en la función getEspecificDataFromPjud:', error);
        await browser.close();
        return false;
    }
    
}

async function loadPageWithRetries(page, url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.waitForSelector('#competencia');
            console.log(`Página cargada exitosamente en el intento ${attempt}`);
            return; // Salir de la función si se carga correctamente
        } catch (error) {
            console.warn(`Error al cargar la página (intento ${attempt}):`, error);
            if (attempt === maxRetries) {
                throw new Error(`No se pudo cargar la página después de ${maxRetries} intentos`);
            }
        }
    }
}

async function procesarCaso(page,caso, numeroCaso,lineaAnterior,remates) {
    if(remates.has(caso.causa)){
        console.log('Caso repetido:',caso.causa);
        return lineaAnterior;
    }
    remates.add(caso.causa);
    try {
        const valorInicial = await setValoresIncialesBusquedaCausa(page, caso);
        if (!valorInicial) {
            console.log('No se encontraron los valores iniciales. Saltando caso.');
            return lineaAnterior; // Salta al siguiente caso
        }
        // console.log('Valores iniciales seteados');
    } catch (error) {
        console.error('Error al setear los valores iniciales:', error);
        return lineaAnterior; // Salta al siguiente caso
    }
    try {
        cambioPagina = await revisarPrimeraLinea(page, lineaAnterior);
    } catch (error) {
        console.error('Error al verificar o procesar la primera línea del caso:', error);
        return lineaAnterior; // Salta al siguiente caso
    }

    try {
        if(!cambioPagina){
            console.log('No se cambio el resultado. Saltando caso.');
            return lineaAnterior; // Salta al siguiente caso
        }
        await getPartesCaso(page, caso);
    } catch (error) {
        console.error('Error al obtener la primera línea del caso:', error);
        return lineaAnterior; // Salta al siguiente caso
    }
    if(config.probarFuncionalidades == true){
        console.log('Test Pjud activado');
        await buscarGP(page);    
    }

    console.log('Checkpoint 3');
    // console.log('Caso procesado:',numeroCaso," con causa :", caso.causa);
    const lineaActual = getPrimeraLinea(page);
    return lineaActual;
}

// Obtiene las partes del remate.
async function getPartesCaso(page,caso){
    let partes = 'N/A';
    try{
        partes = await page.$eval('#dtaTableDetalle tbody tr:first-child', (row) => {
            const cells = row.querySelectorAll('td');
            const caratulado= cells[3] ? cells[3].innerText.trim() : '';
            return caratulado; 
        });
    }catch(error){
        console.error('Error al obtener las partes :', error);
        return false;
    }
      caso.darPartes(partes);
    //   console.log('Partes:',partes," del caso con causa: ",caso.causa);
      return true;
}

async function revisarPrimeraLinea(page, lineaAnterior){
    try {
        await page.waitForSelector('#btnConConsulta');
        await page.click('#btnConConsulta');
        await page.waitForSelector('#dtaTableDetalle tbody tr:first-child', { timeout: 1000 });
        console.log('Tabla encontrada');
        // el waitForFunction espera a que la tabla se actualice
        // sus parametros son una función que se ejecuta en el contexto de la página
        // un objeto con las opciones de timeout
        // variables adicionales que se quieran utilizar en la funcion de pagina.
        await page.waitForFunction(
            async (lineaAnterior) => {
                const lineaActual = document.querySelector('#dtaTableDetalle tbody tr:first-child'); 
                if(lineaActual){
                    const cells = lineaActual.querySelectorAll('td');
                    const newContent = Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
                    if(newContent.includes('No se han encontrado')){
                        console.log('La tabla presenta que no se encontro el caso.',cells[0].innerText);
                        return false;
                    }
                    return newContent && newContent !== lineaAnterior;
                }
                return false;
            },
            {timeout:5000}, // Opciones para waitForFunction
            lineaAnterior // Pasar la línea anterior como argumento
        );

        return true;
    } catch (error) {
        // console.log('No se encontró la tabla. Saltando caso.');
        return false; // Salta al siguiente caso
    }

}

async function getPrimeraLinea(page){
    const primeraLinea = await page.$eval('#dtaTableDetalle tbody tr:first-child', (row) => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
      });

    console.log('Checkpoint 4');
      return primeraLinea;
}
// Función para decretar los valores iniciales de la búsqueda de la causa.
async function setValoresIncialesBusquedaCausa(page, caso) {
    // Primero se revisa que el caso tenga los valores necesarios para la búsqueda
    const valores = {
        corte: caso.getCortePjud(),
        juzgado: caso.juzgado,
        causa: caso.getCausaPjud(),
        anno: caso.getAnnoPjud()
    };
    console.log('Valores:',valores);
    for (const [clave,valor] of Object.entries(valores)){
        if(valor === null){
            console.log('Falta valor:',clave);
            return false;
        }
    }
    const valorCompetencia = "3";
    
    // Seleccionar competencia
    await page.waitForSelector('#competencia');
    await page.select('#competencia', valorCompetencia);

    // Esperar a que el siguiente selector se actualice
    await page.waitForFunction(() => {
        const conCorte = document.querySelector('#conCorte');
        return conCorte && conCorte.options.length > 1; // Verifica que haya más de una opción disponible
    });

    // Seleccionar corte
    await page.select('#conCorte', valores.corte);
    // console.log('Corte seleccionada:',valores.corte);

    // Opcional: Verifica que el valor fue seleccionado correctamente
    const valorCorte = await page.$eval('#conCorte', el => el.value);
    // console.log(`Valor seleccionado: ${selectedValue}`); // Debería imprimir "10"
    if(valorCorte !== valores.corte){
        console.log('No se seleccionó el corte:',valores.corte);
        return false;
    }
    // Esperar actualización del selector dependiente
    await page.waitForFunction(() => {
        const conTribunal = document.querySelector('#conTribunal');
        return conTribunal && conTribunal.options.length > 1;
    });

    // Seleccionar tribunal
    const valorTribunal = await seleccionarTribunal(page,valores.juzgado);
    if(valorTribunal === null){
        console.log('No se encontró el tribunal:',valores.juzgado);
        return false;
    }

    await page.select('#conTribunal', valorTribunal);
    const tribunalValue = await page.$eval('#conTribunal', el => el.value);
    if(tribunalValue !== valorTribunal){
        console.log('No se seleccionó el tribunal:',valores.juzgado);
        return false;
    }

    // Esperar a que se actualize el selector de tipo de causa
    await page.waitForFunction(() => {
        const conTipoCausa = document.querySelector('#conTipoCausa');
        return conTipoCausa && conTipoCausa.options.length > 1;
    });
    // Seleccionar tipo de causa
    await page.select('#conTipoCausa', 'C');

    // Rol de la causa
    await page.waitForSelector('#conRolCausa');
    await page.type('#conRolCausa', valores.causa);
    const rolValue = await page.$eval('#conRolCausa', el => el.value);
    if(rolValue !== valores.causa){
        console.log('No se seleccionó el rol:',valores.causa);
        return false;
    }
    // Año de la causa
    await page.waitForSelector('#conEraCausa');
    await page.type('#conEraCausa', valores.anno); 
    const annoValue = await page.$eval('#conEraCausa', el => el.value);
    if(annoValue !== valores.anno){
        console.log('No se seleccionó el año:',valores.anno);
        return false;
    }
    return true;
}


async function seleccionarTribunal(page, nombreTribunal) {
    // Obtenemos el valor del tribunal correspondiente por su nombre
    const value = await page.evaluate((nombreTribunal) => {
        // Obtenemos todas las opciones del select
        const options = Array.from(document.querySelectorAll('#conTribunal option'));
        
        // Encontramos la opción que contiene el nombre del tribunal
        const option = options.find(opt =>{
            
            const texto = opt.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return texto.includes(nombreTribunal.toLowerCase());
        });
            
        
        // Si la opción se encuentra, retornamos su value, si no, retornamos null
        return option ? option.value : null;
    }, nombreTribunal);

    // Si se encuentra un valor, lo retornamos; si no, retornamos null
    return value;
}

async function buscarGP(page){
    try{
        // Espera a que la tabla esté presente en la página
        await page.waitForSelector('#verDetalle a');

        // Selecciona el enlace dentro del tbody con id "verDetalle"
        const enlace = await page.$('#verDetalle a');
        if (enlace) {
            console.log('Enlace encontrado, haciendo clic...');
            await enlace.click(); // Simula un clic en el enlace
            await selectCuaderno(page);
            await getGPTablaCausa(page);
            await delay(5000);
        } else {
            console.error('No se encontró el enlace dentro del tbody.');
        }
    }catch(error){
        console.error('Error al obtener las partes :', error);
        return false;
    }
}


async function selectCuaderno(page) {
    // Esperar a que el <select> esté disponible
   // Esperar a que el <select> esté disponible   
    await page.waitForSelector('#selCuaderno');

    // Obtener todas las opciones del <select>
    const options = await page.$$eval('#selCuaderno option', (opts) => {
        return opts.map(option => ({
            text: option.textContent.trim(),
            value: option.value
        }));
    });

    console.log('Opciones encontradas:', options);

    // Buscar la opción que contiene "2 - Apremio Ejecutivo Obligación de Dar"
    const optionToSelect = options.find(option => option.text.includes('Apremio Ejecutivo'));

    if (optionToSelect) {
        // Seleccionar la opción encontrada
        await page.select('#selCuaderno', optionToSelect.value);
    } else {
        console.log('La opción deseada no se encuentra en el select.');
    }
}

async function getGPTablaCausa(page){
    try{
        await page.waitForSelector("#historiaCiv", { timeout: 10000 });

        // Get all rows from the table
        const rows = await page.$$('#historiaCiv .table tbody tr');
        console.log(rows.length);
        for (const row of rows) {
            // Track if the row is processed successfull
                try {
                    success = await procesarFila(page,row);
                } catch (error) {
                    console.error(`Error processing row on attempt : ${error.message}`);
                    success = ERROR;
                }
        }

    }catch(error){
        console.error('Error en la función getDatosTablaRemate:', error);
        return [];
    }

}

async function procesarFila(page,row){
    const [etapa, tramite, descripcion, fecha] = await Promise.all([
        row.$eval('td:nth-child(4)', el => el.textContent.trim()),
        row.$eval('td:nth-child(5)', el => el.textContent.trim()),
        row.$eval('td:nth-child(6)', el => el.textContent.trim()),
        row.$eval('td:nth-child(7)', el => el.textContent.trim()),
    ]);
    // console.log(descripcion);
    if(descripcion === 'Cumple lo ordenado'){
        button = await row.$('td:nth-child(3) a');
        if(!button){
            console.log('No se encontró el botón');
            return ERROR;
        }
        await page.waitForSelector('td:nth-child(3) a',{visible:true});
        console.log('Botón encontrado');
        await button.click();
        await page.waitForSelector('div.table-responsive table.table-hover.table-striped',{visible:true});
        const rows = await page.$$('div.table-responsive table.table-hover.table-striped tbody tr');
        for(let tableRow of rows){
            await obtenerPDF(page,tableRow);
        }
        // await delay(5000);
        return EXITO;
    }
    return ERROR;
}

async function obtenerPDF(page,row){
    const linkPjud = "https://oficinajudicialvirtual.pjud.cl/ADIR_871/civil/documentos/anexoDocCivil.php?dtaDoc=";
    const [fecha,referencia] = await Promise.all([
        row.$eval('td:nth-child(2)', el => el.textContent.trim()),
        row.$eval('td:nth-child(3)', el => el.textContent.trim()),
    ]);
    console.log('Fecha :',fecha);
    console.log('Referencia :',referencia);
    console.log('Row :',row);
    const idValue = await row.$eval('form input[name="dtaDoc"]', input => input.value);
    const linkPDF = linkPjud + idValue;
    console.log('Link PDF:',idValue," referencia :",referencia);
    
    await delay(2000);
}
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

module.exports = {getConsultaCausaPjud};