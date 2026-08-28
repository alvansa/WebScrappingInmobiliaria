const DataInmobiliaria = require('./obtainDataInmobilaria');
const logger = require('#utils/logger.js');

async function main(){
    const comuna = 'Curacaví';
    // const rol = '00063-00012';
    const rol = '63-12'
    const res = await DataInmobiliaria.obtainData(comuna,rol);
    logger.info(`Datos obtenidos de la inmobiliaria: ${JSON.stringify(res)}`);
}

main();