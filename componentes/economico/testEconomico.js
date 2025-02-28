const {testUnico, procesarDatosRemate} = require('./datosRemateEmol.js');
const Caso = require('../caso/caso.js');
const process = require('process');
const Causas = require('../../model/Causas.js');

async function testLink(){
    try {
        const link ="https://www.economicos.cl/remates/clasificados-remates-cod7468887.html";
        const fechaHoy = new Date();
        const caso = await testUnico(fechaHoy,link);

    }catch (error) {
        console.error('Error al obtener resultados:', error);
    }
}
async function testLinkArgs(link){
    try {
        const fechaHoy = new Date();
        const caso = await testUnico(fechaHoy,link);

    }catch (error) {
        console.error('Error al obtener resultados:', error);
    }
}


function testTexto(){
    try{
        const texto = "Extracto 1º Juzgado Civil de Puente Alto, Domingo Tocornal Nº 143, con fecha 22 de Enero del año 2025, a las 14:30 horas., remate propiedad Avenida Las Nieves 643, lote 227, manzana 16, Conjunto Habitacional Ciudad del Sol, Lote C Cuatro A, Etapa 2.8, Puente Alto, inscrito a fojas 6792 Nº 4579 del año 2006, Conservador de Bienes Raíces de Puente Alto mínimo $89.504.559. Precio contado dentro de 5º día hábil desde firma acta de remate, Caución mínima 10% mediante Vale Vista Banco Estado hasta 1 hora antes de la subasta, excepcionalmente a través de depósito en la cuenta corriente del Tribunal con 72 horas antes de la subasta. Modalidad mixta. Obligatorio para postores tener activa Clave Única. Demás bases y antecedentes secretaria del tribunal. Rol C-2454-2009. Secretario.";
        const testCaso = new Caso();
        testCaso.darTexto(texto);
        procesarDatosRemate(testCaso); 
        const casoObjt = testCaso.toObject();
        console.log("Caso: ",casoObjt);
    }catch(error){
        console.error('Error al obtener resultados:', error);
    }
}

function obtainCausasFromDB(){
    try {
        const causa = new Causas();
        const causas = causa.getAllCausas();
        console.log("Causas: ",causas);
    }catch (error) {
        console.error('Error al obtener resultados:', error);
    }
}

function use(){
    console.log("Uso: node testEconomico.js -l para probar un link fijo en el codigo o node testEconomico.js -t para probar un texto o node testEconomico.js -L link para probar el link -d para probar la base de datos");
}

async function main(){
    const args = process.argv.slice(2);
    console.log(args);
    if(args.length === 0){
        use();
        return;
    }
    if(args[0] === "-l"){
        await testLink();
    }else if(args[0] === "-t"){
        testTexto();
    }else if(args[0] === "-L"){
        testLinkArgs(args[1]);
    }else if(args[0] === "-d"){
        obtainCausasFromDB();
    }else if(args[0] === "-borrar"){
        const causa = new Causas();
        causa.DeleteAll();
    }else if(args[0] === "-drop"){
        const causa = new Causas();
        causa.DropCausa();
    }else if(args[0] === "-tables"){
        const causa = new Causas();
        console.log(causa.getTables());
    }else if(args[0] === "-create"){
        const causa = new Causas();
        causa.createDB();
    }else if(args[0] === "-getFecha"){
        const causa = new Causas();
        console.log(causa.getCausas("2025-02-13"));
    }else if(args[0] === "-searchCausa"){
        const causa = new Causas();
        console.log(causa.searchByCausa(args[1]));
    }else{
        use();
    }
}

main()



/* Ejemplo de derecho de agua.
Ante 3° Juzgado Letras de La Serena, ubicado en Rengifo 240, causa Rol N° C1529-2014, juicio ejecutivo, caratulado “BANCO DE CHILE/AGRICOLA IGNACIO
CORTES ARAOS”, se rematará el 27 de septiembre de 2024, a las 09:00 horas, el
derecho de aprovechamiento de aguas que consiste en el uso de una coma noventa
y cinco acciones provenientes del Canal Alto Peralillo de la Hoya Hidrográfica del
Río Elqui, ubicado en la comuna de Vicuña, Provincia de Elqui, Cuarta Región,
inscrito a nombre de la ejecutada Agrícola Ignacio Cortés Araos, Empresa Individual
de Responsabilidad Limitada o Agrícola I.C.A. E.I.R.L. a fojas 229 número 227 del
Registro de Propiedad de Aguas del Conservador de Bienes Raíces de Vicuña del
año 2006. Mínimo subasta: UF 306,56, equivalentes a $11.579.219, según valor
U.F. al día 02-09-2024. Precio deberá pagarse de contado dentro de quinto día hábil
de firmada el acta de remate. Interesados en tomar parte deberán presentar vale
vista emitido por Banco Estado de Chile a la orden del tribunal, por valor equivalente
al 10% del mínimo de la subasta. Demás antecedentes en expediente. La Serena,
2 de septiembre del año 2024.
 */ 