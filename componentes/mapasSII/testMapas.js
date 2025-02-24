const MapasSII = require('./MapasSII.js');
const {testUnico, procesarDatosRemate} = require('../economico/datosRemateEmol.js');


async function main(){
    const args = process.argv.slice(2);
    console.log(args);
    if(args.length === 0){
        use();
        return;
    }
    if(args[0] === "-m"){
        const testCausa = new MapasSII();
        await testCausa.Initialize();
        await testCausa.obtainDataOfCause("MAIPÚ", "2294", "26");
    }else if(args[0] === "-l"){
        const link = args[1];
        const caso = await testLinkArgs(link);
        const testCausa = new MapasSII();
        await testCausa.Initialize();
        await testCausa.obtainDataOfCause(caso);
        await testCausa.closeBrowser();
        console.log(caso.toObject());

    }
    else{
        console.log("a");
        use();
    }
}

async function testLinkArgs(link){
    let caso = null;
    try {
        const fechaHoy = new Date();
        caso = await testUnico(fechaHoy,link);
        return caso;

    }catch (error) {
        console.error('Error al obtener resultados:', error);
        return caso;
    }
}
main();