const { chromium } = require('playwright'); // También puedes usar 'firefox' o 'webkit'
const Caso = require('../caso/caso');

const ERROR = 0;

class ConsultaCausaPjudPlaywright {
    constructor(casos) {
        this.casos = casos;
        this.browser = null;
        this.page = null;
        this.link = 'https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php';
    }

    async getConsultaCausaPjud() {
        let lineaAnterior = '';
        this.browser = await chromium.launch({ 
            headless: false,
            args: [
                '--disable-blink-features=AutomationControlled', 
            ],
        });
        this.context = await this.browser.newContext();
        // 2. Crear un contexto y una página
        await this.loadPageWithRetries();
        console.log('Configuraciones iniciales creadas');
        console.log('Página cargada: ', this.casos, this.casos.entries());
        try {
            for (let [index, caso] of this.casos.entries()) {
                lineaAnterior = await this.procesarCaso(caso, lineaAnterior); // Procesa cada caso individualmente
                console.log('Intentando caso:', index + 1, caso.causa);
            }
            
            await delay(4000);
            await this.browser.close();
            return true;
        } catch (error) {
            console.error('Error en la función getEspecificDataFromPjud:', error);
            await this.browser.close();
            return false;
        }
    }

    async loadPageWithRetries(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Intento ${attempt} de carga de página...`);
                this.page = await this.context.newPage();
                await this.page.goto(this.link );
                await this.page.waitForSelector('#competencia');
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
    async procesarCaso(caso,  lineaAnterior) {
        try {
            const valorInicial = await this.setValoresIncialesBusquedaCausa(caso);
            if (!valorInicial) {
                console.log('No se encontraron los valores iniciales. Saltando caso.');
                return lineaAnterior; // Salta al siguiente caso
            }
        } catch (error) {
            console.error('Error al setear los valores iniciales:', error);
            return lineaAnterior; // Salta al siguiente caso
        }

        await this.page.waitForSelector('#btnConConsulta');
        await this.page.click('#btnConConsulta');
        console.log('Checkpoint 3');
        // console.log('Caso procesado:',numeroCaso," con causa :", caso.causa);

        console.log('Test Pjud activado');
        await this.buscarGP();
        return true;
    }

    async setValoresIncialesBusquedaCausa(caso) {
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
        await this.page.waitForSelector('#competencia');
        await this.page.selectOption('#competencia', {value : valorCompetencia});
        console.log('Competencia seleccionada:',valorCompetencia);

        // Esperar a que el siguiente selector se actualice
        await this.page.waitForFunction(() => {
            const conCorte = document.querySelector('#conCorte');
            return conCorte && conCorte.options.length > 1; // Verifica que haya más de una opción disponible
        });

        // Seleccionar corte
        await this.page.selectOption('#conCorte',{value: valores.corte}) ;
        console.log('Corte seleccionada:',valores.corte);

        // Opcional: Verifica que el valor fue seleccionado correctamente
        const valorCorte = await this.page.$eval('#conCorte', el => el.value);
        // console.log(`Valor seleccionado: ${selectedValue}`); // Debería imprimir "10"
        if(valorCorte !== valores.corte){
            console.log('No se seleccionó el corte:',valores.corte);
            return false;
        }
        // Esperar actualización del selector dependiente
        await this.page.waitForFunction(() => {
            const conTribunal = document.querySelector('#conTribunal');
            return conTribunal && conTribunal.options.length > 1;
        });

        // Seleccionar tribunal
        const valorTribunal = await this.seleccionarTribunal(valores.juzgado);
        if(valorTribunal === null){
            console.log('No se encontró el tribunal:',valores.juzgado);
            return false;
        }
        await this.page.selectOption('#conTribunal',{value: valorTribunal} );
        console.log('Tribunal seleccionado:',valorTribunal);

        const tribunalValue = await this.page.$eval('#conTribunal', el => el.value);
        if(tribunalValue !== valorTribunal){
            console.log('No se seleccionó el tribunal:',valores.juzgado);
            return false;
        }

        // Esperar a que se actualize el selector de tipo de causa
        await this.page.waitForFunction(() => {
            const conTipoCausa = document.querySelector('#conTipoCausa');
            return conTipoCausa && conTipoCausa.options.length > 1;
        });
        // Seleccionar tipo de causa
        await this.page.selectOption('#conTipoCausa',{value : 'C'});
        console.log('Tipo de causa seleccionada: C');

        // Rol de la causa
        await this.page.waitForSelector('#conRolCausa');
        await this.page.fill('#conRolCausa', valores.causa);
        const rolValue = await this.page.$eval('#conRolCausa', el => el.value);
        if(rolValue !== valores.causa){
            console.log('No se seleccionó el rol:',valores.causa);
            return false;
        }
        console.log('Rol de causa seleccionado:',valores.causa);

        // Año de la causa
        await this.page.waitForSelector('#conEraCausa');
        await this.page.fill('#conEraCausa', valores.anno); 
        const annoValue = await this.page.$eval('#conEraCausa', el => el.value);
        if(annoValue !== valores.anno){
            console.log('No se seleccionó el año:',valores.anno);
            return false;
        }
        console.log('Año de causa seleccionado:',valores.anno);
        return true;
    }

    async seleccionarTribunal(nombreTribunal) {
        // Obtenemos el valor del tribunal correspondiente por su nombre
        const value = await this.page.evaluate((nombreTribunal) => {
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

    async buscarGP(){
        try{
            // Espera a que la tabla esté presente en la página
            await this.page.waitForSelector('#verDetalle a');

            // Selecciona el enlace dentro del tbody con id "verDetalle"
            const enlace = await this.page.$('#verDetalle a');
            if (enlace) {
                console.log('Enlace encontrado, haciendo clic...');
                await enlace.click(); // Simula un clic en el enlace
                const selectedCuaderno = await this.selectCuaderno();
                if(!selectedCuaderno){
                    console.log('No se seleccionó el cuaderno');
                    return false;
                }
                await this.getAvaluoTablaCausa();
                // await delay(5000);
            } else {
                console.error('No se encontró el enlace dentro del tbody.');
            }
        }catch(error){
            console.error('Error al obtener las partes :', error);
            return false;
        }
    }

    async selectCuaderno() {
        // Esperar a que el <select> esté disponible
        await this.page.waitForSelector('#selCuaderno');

        // Obtener todas las opciones del <select>
        const options = await this.page.$$eval('#selCuaderno option', (opts) => {
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
            await this.page.selectOption('#selCuaderno',{value: optionToSelect.value} );
        } else {
            console.log('La opción deseada no se encuentra en el select.');
        }
        const cuadernoValue = await this.page.$eval('#selCuaderno', el => el.value);
        if(cuadernoValue !== optionToSelect.value){
            console.log('No se seleccionó el cuaderno:',optionToSelect.text);
            return false;
        }
        return true;

    }
    async getAvaluoTablaCausa(){
        let success = ERROR;
        try{
            await this.page.waitForSelector("#historiaCiv", { timeout: 10000 });

            // Get all rows from the table
            const rows = await this.page.$$('#historiaCiv .table tbody tr');
            console.log(rows.length);
            for (const row of rows) {
                // Track if the row is processed successfull
                    try {
                        if(success === EXITO){
                            break;
                        }
                        success = await this.procesarFilaTablaPrincipal(row);
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

    async procesarFilaTablaPrincipal(row){
        const [etapa, tramite, descripcion, fecha] = await Promise.all([
            row.$eval('td:nth-child(4)', el => el.textContent.trim()),
            row.$eval('td:nth-child(5)', el => el.textContent.trim()),
            row.$eval('td:nth-child(6)', el => el.textContent.trim()),
            row.$eval('td:nth-child(7)', el => el.textContent.trim()),
        ]);
        // console.log(descripcion);
        // || descripcion.includes('Propone bases de remate')
        if(descripcion === 'Cumple lo ordenado' ){
            const button = await row.$('td:nth-child(3) a');
            if(!button){
                console.log('No se encontró el botón');
                return ERROR;
            }
            await this.page.waitForSelector('td:nth-child(3) a',{visible:true});
            console.log('Botón encontrado',descripcion,fecha);
            await button.click();
            const tableSelector = 'div#modalAnexoSolicitudCivil div.table-responsive table.table-striped.table-hover'
            await this.page.waitForSelector(tableSelector,{visible:true});
            const rows = await this.page.$(tableSelector + ' tbody tr');
            // await this.obtenerPDF(rows);
            // for(let tableRow of rows){
            //     await obtenerPDF(page,tableRow);
            // }
            // await delay(5000);
            return EXITO;
        }
        return ERROR;
    }

    async obtenerPDF(row){
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
        console.log('Link PDF:',linkPDF);
        
        await this.procesarPdf(linkPDF);
    }


    async procesarPdf(link){
        let newPage = await this.browser.newPage();
        const response = await newPage.goto(link,{waitUntil: 'networkidle2'});
        if(response.ok()){
		await newPage.pdf({path: 'componentes/pjud/page.pdf', format: 'A4'});
		const pdfBuffer = await response.buffer();
		console.log(pdfBuffer);
		const pdfPath = path.join(__dirname, 'archivo_descargado.pdf');
 		fs.writeFileSync(pdfPath, pdfBuffer);
        }
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function main(){
    const caso = new Caso("2025/11/30");
    caso.juzgado = "7º JUZGADO CIVIL DE SANTIAGO";
    caso.causa = "C-5336-2022";
    const causa = new ConsultaCausaPjudPlaywright([caso]);
    causa.getConsultaCausaPjud().then((result) => {
        console.log('Resultado:', result);
    }).catch((error) => {
        console.error('Error:', error);
    });
}
main();