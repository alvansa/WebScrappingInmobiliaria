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
        const texto = "Remate: Décimo Cuarto Juzgado Civil De Santiago, Huérfanos 1409, Piso 4, Santiago, rematará 14 de mayo de 2025 a las 11:15 horas, propiedad ubicada en la comuna de Puente Alto, Provincia Cordillera, consistente en la casa o unidad signada con el n° 107, con acceso general por calle La Montura n° 071285, del conjunto habitacional denominado Condominio El Huinganal. El título de dominio se encuentra inscrito a fojas 1.379 n° 2.284 del registro de propiedad correspondiente al año 2016 del Conservador De Bienes Raíces De Puente Alto. Mínimo de la subasta será la suma de $ 126.815.226.- precio remate se pagará al contado, en dinero efectivo, debiendo consignarse mediante depósito en la cuenta corriente del tribunal, dentro de quinto día hábil siguiente de firmada el acta de remate. Los postores deberán rendir caución suficiente por medio de vale vista tomado a propia orden, susceptible de ser endosado al momento de la subasta, por el 10% del mínimo total establecido para la subasta. La participación en la subasta requiere la presencia física en el tribunal en la fecha y hora indicadas. No se aceptarán ofertas de manera remota. El subastador deberá suscribir el acta de remate en el momento de la subasta. Se hace presente que la subasta se realizará de manera presencial en las dependencias del tribunal, debiendo los postores interesados concurrir al tribunal en la fecha y hora señaladas. Demás bases y antecedentes en autos rol c-9545-2023, Banco Santander Chile Con Sanhueza.";
        const testCaso = new Caso("2025-05-05");
        testCaso.texto = texto;
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