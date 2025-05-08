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
        const texto = 'Extracto. Juzgado Cobranza Laboral y Previsional Santiago, San Martín N° 950, 7 piso, Santiago, RIT C-3594-2023 RUC: 22-4-0410204-8, "Miño/H.E. Fiberglass S.I.C. S.A.", 22/05/2025 12:00 horas, se rematará inmueble ubicado en Las Araucarias N° 9000, Quilicura, Santiago, Región Metropolitana. De propiedad H.E. Fiberglass Sociedad Industrial y Comercial S.A. Inscrita Fojas 65960 N° 58203 Registro Propiedad 1991 Conservador de Bienes Raíces de Santiago. Mínimo posturas $1.215.388.108. Precio pagado contado dentro quinto día hábil realizada subasta mediante depósito cuenta corriente tribunal. Derecho posturas consignar garantía suficiente $121.538.810 equivalente 10% mínimo, mediante vale vista a nombre del Tribunal. Remitir comprobante por escrito presentado por O.J.V, junto copia carnet identidad señalando nombre completo persona participará calidad de postor, email y teléfono, si actúa por sí o en representación de otro, y en este último caso deberá expresar los datos de la persona - natural o jurídica - a quien representa, nombre y RUT del tomador del vale vista y correo electrónico del participante, y remitir mismos antecedentes a jcobsantiago_remates@pjud.cl. Plazo vence 12:00 horas día anterior fecha fijada para el remate. Se realizará dependencias Tribunal ubicado en San Martin N° 950 piso 8, Santiago. Ejecutante no deberá presentar garantía para tomar parte subasta, abonándose a precio remate el valor del crédito tenga contra ejecutante. Subastador designará domicilio dentro radio urbano Santiago. Demás bases y antecedentes del remate de la propiedad y derechos, causa individualizada, accediendo a módulos consulta tribunal o www.poderjudicial.cl. Santiago, veintiuno de abril de dos mil veinticinco.';
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