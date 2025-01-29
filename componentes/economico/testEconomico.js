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

function use(){
    console.log("Uso: node testEconomico.js -l para probar un link fijo en el codigo o node testEconomico.js -t para probar un texto o node testEconomico.js -L link para probar el link");
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
    }else{
        use();
    }
}

main()