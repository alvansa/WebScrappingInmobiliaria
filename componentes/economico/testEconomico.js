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
        const texto = 'Remate Décimo Séptimo Juzgado Civil Santiago, Huérfanos 1409, 5º piso, se rematará en dependencias del tribunal, el día 8 de mayo de 2025, a las 10:30 horas, la propiedad propiedad ubicada en Avenida Grumete Díaz número ocho mil cincuenta, que corresponde al lote número seis de la manzana G del campamento Arturo Prat, comuna de La Florida, Región Metropolitana. Inmueble inscrito a nombre del ejecutado a fojas 92800 número 131233 correspondiente al registro de propiedad del año 2018 del Conservador De Bienes Raíces De Santiago. Mínimo postura en la suma de $ 52.694.968.- los interesados deberán constituir garantía suficiente, equivalente al 10% del mínimo establecido para la subasta, para participar en el remate mediante vale vista a la orden del tribunal, que deberá entregarse a la sra. Oficial primero, y enviar un correo electrónico a jcsantiago17_remates@pjud.cl, indicando en el asunto remate rol C-17494-2023, señalando sus datos personales, adjuntando comprobante legible de la garantía y de cedula de identidad, correo electrónico y un número telefónico de contacto, todo ello antes de las 12:00 horas del día anterior al fijado para el remate. Asimismo, se hace presente a los postores, que para efectos del cumplimiento de lo dispuesto en el inciso quinto del artículo 29 de la ley 21.389, deberán señalar en su postura, si fuera pertinente, los datos de la persona por quien se presentan, para efectos de realizar la revisión en el registro correspondiente. En el caso que éste sea una persona natural deberá constar con el correspondiente certificado emitido por el registro nacional de deudores de pensiones de alimentos a fin de dar cumplimiento a lo dispuesto por el inciso 5° del artículo 29 de la ley 21.389, bajo apercibimiento de no ser admitido para participar en el remate como postor. El precio de la subasta deberá ser pagado mediante consignación en la cuenta corriente del tribunal, dentro de quinto día hábil siguiente a la fecha de remate y suscripción de la respectiva acta. De no consignarse el precio en dicho plazo, el remate quedará sin efecto, y se hará efectiva la caución que se señaló en la base tercera. El valor de ésta, deducido el monto de los gastos del remate, se abonará en un 50% al crédito y en un 50%a beneficio de la corporación administrativa del poder judicial. Demás antecedentes y bases juicio Banco De Chile Con Bustamante, Rol C-17494-2023. Secretaria.';
        const testCaso = new Caso("2025-05-05");
        testCaso.texto = texto;
        procesarDatosRemate(testCaso); 
        const casoObjt = testCaso.toObject();
        console.log("Caso: ",casoObjt);
        return casoObjt;
    }catch(error){
        console.error('Error al obtener resultados:', error);
        return null;
    }
}

function testTextoArgs(texto){
    try{
        const testCaso = new Caso("2025-05-05");
        testCaso.texto = texto;
        procesarDatosRemate(testCaso); 
        const casoObjt = testCaso.toObject();
        console.log("Caso: ",casoObjt);
        return casoObjt;
    }catch(error){
        console.error('Error al obtener resultados:', error);
        return null;
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
    console.log(`
       Uso : node testEconomico.js
        -h : ayuda
        -l : probar el link fijo en el codigo
        -t : probar un texto
        -L link : probar el link
        -all : obtener todas las causas de la base de datos 
        -borrar : borrar todas las causas de la base de datos
        -drop : borrar la tabla causa
        -tables : obtener las tablas de la base de datos
        -create : crear la base de datos
        -getFecha : obtener las causas previas a una fecha fija 2025-02-13
        -searchCausa causa : buscar una causa en la base de datos con causa como parametro
        `)
}

async function main(){
    const args = process.argv.slice(2);
    console.log(args);
    if(args.length === 0){
        use();
        return;
    }
    if(args[0] === "-h"){
        use();
    }else if(args[0] === "-l"){
        await testLink();
    }else if(args[0] === "-t"){
        testTexto();
    }else if(args[0] === "-L"){
        testLinkArgs(args[1]);
    }else if(args[0] === "-all"){
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

// main()
module.exports = {
    testLink,
    testLinkArgs,
    testTexto,
    obtainCausasFromDB,
    testTextoArgs,
}



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