const {testUnico, procesarDatosRemate} = require('./datosRemateEmol.js');
const Caso = require('../caso/caso.js');
const process = require('process');

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
        const texto = "Ante 16º Juzgado Civil Santiago, Huérfanos 1409, 4º piso, subastará mediante plataforma zoom, el 30 de enero de 2025, a las 10:30 horas, inmueble consistente Departamento número seiscientos uno ubicado en el sexto piso, del conjunto Habitacional Altavista, correspondiente al Edificio denominado Torre A, con ingreso por Avenida Américo Vespucio número cero trescientos noventa, del Lote A, enmarcado en el polígono A-B-C-D-A, Comuna de La Cisterna, y dueña, además de derechos en proporción al valor de lo adquirido en unión de los otros adquirientes en los bienes comunes entre los cuales se encuentra el terreno, inscrito a Fojas 5342 número 3273, Registro Propiedad 2013, Conservador Bienes Raíces San Miguel. Se incluyen en subasta derecho de uso y goce de estacionamiento Nº 30 del mismo Conjunto Habitacional. Mínimo posturas $ 40.636.366. Toda persona que desee participar en la subasta deberá rendir caución que no podrá ser inferior al 10% del mínimo fijado para el remate, mediante vale vista tomado en cualquier banco de la plaza, a la orden del tribunal, con indicación del tomador para facilitar su devolución. El vale vista deberá ser presentado en la secretaría del tribunal el día precedente a la fecha fijada para la realización de la subasta, entre las 11:00 y 12:00 horas. No se admiten vale vistas fuera de este horario. Al momento de presentar el vale vista, el postor deberá informar un correo electrónico y un número telefónico válido, a través de un acta predeterminada que será suscrita por el postor e incorporada a la Carpeta Electrónica por el ministro de fe, conjuntamente con una copia del Vale Vista. Se utilizará la plataforma Zoom, para lo cual se requiere de un computador o teléfono, en ambos casos, con cámara, micrófono y audio del mismo equipo y conexión a internet. El saldo del precio deberá ser pagado dentro de quinto día siguiente al remate. Bases, antecedentes y detalle de la subasta en resolución que fija el protocolo de esta, de folio 14 del cuaderno de apremio, autos ejecutivos Scotiabank con Jorquera, Lorena, Rol C-7073-2024. Secretaria.";
        const testCaso = new Caso();
        testCaso.darTexto(texto);
        procesarDatosRemate(testCaso); 
        const casoObjt = testCaso.toObject();
        console.log("Caso: ",casoObjt);
    }catch(error){
        console.error('Error al obtener resultados:', error);
    }
}

function use(){
    console.log("Uso: node testEconomico.js -l para probar un link o node testEconomico.js -t para probar un texto");
}

async function main(){
    const args = process.argv.slice(2);
    console.log(args);
    if(args.length === 0){
        console.log("No se ingresaron argumentos");
        return;
    }
    if(args[0] === "-l"){
        await testLink();
    }else if(args[0] === "-t"){
        testTexto();
    }else if(args[0] === "-L"){
        testLinkArgs(args[1]);
    }else{
        use();
    }
}

main()