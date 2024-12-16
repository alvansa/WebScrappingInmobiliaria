const puppeteer = require('puppeteer');


async function getConsultaCausaPjud(tablaRemates){
    let numeroCaso = 0;
    let valorInicial = false;
    // const casos = crearCasosPrueba();
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php');
    try{
        for (let [index, caso] of tablaRemates.entries()) {
            await procesarCaso(page,caso, index + 1); // Procesa cada caso individualmente
        }
        await browser.close();
        return tablaRemates;
    }catch(error){
        console.error('Error en la función getEspecificDataFromPjud:', error);
        await browser.close();
        return false;
    }
    
}


async function procesarCaso(page,caso, numeroCaso) {
    console.log('Intentando caso:', numeroCaso);

    try {
        const valorInicial = await setValoresIncialesBusquedaCausa(page, caso);
        if (!valorInicial) {
            console.log('No se encontraron los valores iniciales. Saltando caso.');
            return; // Salta al siguiente caso
        }
        console.log('Valores iniciales seteados');
    } catch (error) {
        console.error('Error al setear los valores iniciales:', error);
        return; // Salta al siguiente caso
    }

    try {
        await page.waitForSelector('#btnConConsulta');
        await page.click('#btnConConsulta');
    } catch (error) {
        console.error('Error al hacer clic en el botón de consulta:', error);
        return; // Salta al siguiente caso
    }

    try {
        await page.waitForSelector('#dtaTableDetalle tbody tr:first-child', { timeout: 1000 });
        console.log('Tabla encontrada');
    } catch (error) {
        console.log('No se encontró la tabla. Saltando caso.');
        return; // Salta al siguiente caso
    }

    try {
        await getPrimeraLineaCaso(page, caso);
        await delay(100);
    } catch (error) {
        console.error('Error al obtener la primera línea del caso:', error);
        return; // Salta al siguiente caso
    }
}

// Obtiene la primera linea de la tabla
async function getPrimeraLineaCaso(page,caso){
    let primeraLinea = 'N/A';
    try{
        primeraLinea = await page.$eval('#dtaTableDetalle tbody tr:first-child', (row) => {
            const cells = row.querySelectorAll('td');
            const caratulado= cells[3] ? cells[3].innerText.trim() : '';
            return caratulado; 
        });
    }catch(error){
        console.error('Error al obtener la primera linea:', error);
        return false;
    }
      caso.darPartes(primeraLinea);
      console.log('Primera linea:',primeraLinea,caso.causa);
      return true;
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
    console.log('Corte seleccionada:',valores.corte);
    // Opcional: Verifica que el valor fue seleccionado correctamente
    const selectedValue = await page.$eval('#conCorte', el => el.value);
    console.log(`Valor seleccionado: ${selectedValue}`); // Debería imprimir "10"
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

    // Año de la causa
    await page.waitForSelector('#conEraCausa');
    await page.type('#conEraCausa', valores.anno); 

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


function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }
module.exports = {getConsultaCausaPjud};