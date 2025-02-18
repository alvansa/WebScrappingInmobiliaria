
const MapasSII = require('./MapasSII.js');


async function main(){
    const testCausa = new MapasSII("MAIPÚ","2294","26");
    await testCausa.obtainDataOfCause();
}

main();