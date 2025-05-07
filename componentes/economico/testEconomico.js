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
        const texto = "29° Juzgado Civil Santiago, Huérfanos 1409, 18° Piso, comuna de Santiago, se rematará mediante plataforma electrónica Zoom, el 22 de mayo de 2025 a las 15:30 horas, la propiedad consistente en la oficina número mil ciento doce del undécimo piso, el estacionamiento número E ciento treinta y cuatro en conjunto con la bodega número B ochenta y dos, ambos del tercer subterráneo, todos del Edificio Kennedy Cinco Mil Setecientos Setenta, también conocido como Condominio Edificio Centro Kennedy, con acceso por Avenida Presidente Kennedy número cinco mil setecientos setenta, Comuna de Vitacura, Región Metropolitana, de acuerdo al plano archivado bajo el número 5386 y sus láminas respectivas; y los derechos en proporción al valor de lo adquirido en unión de los otros adquirentes en los bienes comunes entre los cuales se encuentra el terreno, que corresponde al sitio ocho guión A, del plano de fusión respectivo. El inmueble se encuentra inscrito a fojas 94873 número 138690 del Registro de Propiedad del año 2022 del Conservador de Bienes Raíces de Santiago. Mínimo para las posturas será la suma de U.F. 2.441,46.-, precio pagadero dentro de quinto día hábil de efectuada esta. Todo interesado en participar como postor deberá rendir garantía suficiente para participar, equivalente al 10% del valor de tasación aprobado, mediante vale vista a la orden del 29° Juzgado Civil de Santiago, documento que se deberá presentar materialmente en la Secretaría del Tribunal hasta las 12:00 hrs. del día hábil anterior a la subasta, y si dicho día fuera sábado, hasta las 12:00 hrs. del viernes anterior a la subasta. Atendida la modalidad de la subasta, se requiere de un computador o teléfono con conexión a Internet, en ambos casos, con cámara, micrófono y audio del mismo equipo, siendo carga de las partes y postores tener los elementos de conexión y tecnológicos. Todo interesado en participar en la subasta como postor, deberá tener activa su Clave Única del Estado, para la eventual suscripción de la correspondiente acta de remate. Los postores interesados deberán ingresar comprobante legible de rendición de la caución, a través del módulo especialmente establecido al efecto en la Oficina Judicial Virtual, y enviar un correo a la casilla electrónica jcsantiago29_remates@pjud.cl, hasta las 12:00 hrs. del día hábil anterior a la subasta, y si dicho día fuera sábado, hasta las 12:00 hrs. del viernes anterior a la subasta, indicando su nombre completo y adjuntando copia -por ambos lados- de su cédula de identidad, indicando el rol de la causa en la cual participará, un correo electrónico y número telefónico para el caso que se requiera contactarlo durante la subasta por problemas de conexión. En caso de suspenderse el remate por motivos imprevistos, ajenos a la voluntad de las partes y del Tribunal, se realizará el día siguiente hábil a las 10:30 hrs, salvo que recayere en sábado, caso en que se verificará el día lunes inmediatamente siguiente, también a las 10:30 hrs. Link de la subasta: https://pjud-cl.zoom.us/j/94171054365. Demás bases y antecedentes en Juicio Ejecutivo de Desposeimiento Banco de Chile con Zúñiga Rol C-7682-2023. Secretaría.";
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