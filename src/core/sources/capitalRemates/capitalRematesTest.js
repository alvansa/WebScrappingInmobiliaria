const CapitalRemates = require('./capitalRemates.js');
const logger = require('#utils/logger.js');

async function main(){
    const argc = process.argv.slice(2);
    // console.log(process.argv)
    // console.log(argc);

    if(argc.length === 0){
        use();
        return;
    }
    const command = argc[0];
    const link = argc[1];
    if(command.includes('--testSingle')){
        await testSingle(link);
    }else if(command.includes('--testMultiple')){

        await testObtainMultiple();
    }else if(command.includes('--mainTest')){
        await mainTest();
    }else{
        use();
    }
}

function use(){
    logger.info('Uso: node test.js <command>');
    logger.info(`Opciones:
        --testSingle: Obtiene datos de un remate específico
        --testMultiple: Obtiene links de remates entre dos fechas
        --mainTest: Obtiene datos de remates entre dos fechas
        --testEconomico: test para probar la union con economicos.cl
        `);
}

async function testSingle(link){
    logger.info('Obteniendo datos de un remate específico');
    // const link = 'https://capitalremates.cl/remates/1859-parcela-paillaco';
    const permamentLnk = 'https://capitalremates.cl/remates/2086-derechos-agua-chile';
    if(!link){
        link = permamentLnk;
    }

    const remate = await CapitalRemates.fetchSingleLink(link);
    const fecha = "2026-04-24 15:00:00"
    const caso = CapitalRemates.parseDataFromRemate(remate, fecha);
    console.log(`Caso obtenido: ${JSON.stringify(caso.toObject(),null, 2)}`)
}

async function testObtainMultiple(){
    const startDate = '2026-04-22';
    const endDate = '2026-04-24';
    const remates = await CapitalRemates.getLinksToRemates(startDate, endDate);
    console.log(remates);
    logger.info(`Total remates obtenidos: ${remates.length}`);
}

async function mainTest(){
    const remates = await CapitalRemates.getRemates('2026-04-22', '2026-04-24');
    console.log(remates);
    console.log(`Total remates obtenidos: ${remates.length}`);
}



main();



