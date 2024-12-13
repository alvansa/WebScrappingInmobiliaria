const puppeteer = require('puppeteer');


async function getConsultaCausaPjud(tablaRemates){
    let numeroCaso = 0;
    let valorInicial = false;
    // const casos = crearCasosPrueba();
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php');
    try{
        for(let caso of tablaRemates){
            console.log('Intentado caso :' , numeroCaso++);
            try{
                valorInicial = await setValoresIncialesBusquedaCausa(page,caso);
            }catch(error){
                console.error('Error al setear los valores iniciales:', error);
                continue;
            }
            if(valorInicial == false){
                console.log('No se encontraron los valores iniciales');
                continue;
            }
            console.log('Valores iniciales seteados');
            await page.waitForSelector('#btnConConsulta');
            await page.click('#btnConConsulta');
            try{
                await page.waitForSelector('#dtaTableDetalle tbody tr:first-child', { timeout: 1000 });
            }catch(error){
                console.log('No se encontró la tabla');
                continue;
            }
            console.log('Tabla encontrada');        
            // agregar que si no se recupera la informacion correctamente, se pasa al siguiente caso.
            await getPrimeraLineaCaso(page,caso);
        }
        await browser.close();
        return tablaRemates;
    }catch(error){
        console.error('Error en la función getEspecificDataFromPjud:', error);
        await browser.close();
        return false;
    }
    
}
// Obtiene la primera linea de la tabla
async function getPrimeraLineaCaso(page,caso){
    const primeraLinea = await page.$eval('#dtaTableDetalle tbody tr:first-child', (row) => {
        const cells = row.querySelectorAll('td');
        const caratulado= cells[3] ? cells[3].innerText.trim() : '';
        const juzgado= cells[4] ? cells[4].innerText.trim() : '';
        return caratulado; 
      });
      caso.darPartes(primeraLinea);
      return (primeraLinea);
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


module.exports = {getConsultaCausaPjud};