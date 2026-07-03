const CapitalRemates = require('./capitalRemates.js');
const logger = require('#utils/logger.js');
const {procesarDatosRemate, normalizeDescription} = require('#sources/economico/datosRemateEmol.js');
const Caso = require('#models/caso/caso.js')

const textoEconomico = `Remate. 1º Juzgado de Letras de Buin. Fijó remate para el día 30 de abril de 2026, a las 12:00 horas, de manera Presencial, en las dependencias del Tribunal ubicado en Calle Arturo Prat Nº 573, 1º Piso, comuna de Buin, para subastar sitio y casa, lote número treinta, ubicado en calle Rucahue número catorce del Conjunto Habitacional Nueva Generación Veinticuatro de Abril, de la comuna de Paine. El inmueble se encuentra inscrito a fojas 1499, Número 1830 del Registro de Propiedad del año 2015, del Conservador de Bienes Raíces de BUIN. Número de Rol de Avalúo: 00271 - 00019. Comuna: Paine. Mínimo subasta: $ 16.042.513 de acuerdo con certificado de avalúo fiscal vigente. Postores interesados en participar de la subasta deberán rendir caución equivalente al 10% del mínimo fijado para la subasta, a través de alguna de las siguientes formas: 1) Mediante Cupón de Pago en el Banco del Estado de Chile, correspondiente al Poder Judicial (http://reca.poderjudicial.cl/RECAWEB/); y 2) Mediante la entrega del Vale Vista a la orden del Tribunal el que deberá ser tomado en el Banco del Estado de Chile. En relación al Cupón de Pago que se utilice para constituir la garantía, este deberá ser acompañado a la causa, para calificar su suficiencia, a más tardar 48 horas anteriores a la subasta, hasta las 12.00 horas, por medio de la respectiva presentación a través de la oficina judicial virtual. La entrega del vale vista a la orden del tribunal, deberá efectuarse en forma presencial ante el secretario del tribunal o quien la subrogue para esos efectos, también 48 horas de antelación a la fecha del remate, entre las 09:00 y las 12.00 horas, quedando en custodia el documento valorado, calificándose en el acto su suficiencia (o no). En ambos casos, deberán ingresar un escrito a través de la Oficina Judicial Virtual, a fin de dar cuenta de la comparecencia personal que acompaña materialmente el Vale Vista, adjuntando copia de dicho documento, o bien, haber realizado la consignación por Cupón de Pago, debiendo anexar también dicho documento de esa actuación. Las presentaciones que fueren efectuadas fuera del plazo antes señalado, se desestimarán sin más trámite, no siendo consideradas para efectos de la participación en la subasta. Saldo precio de la subasta deberá ser integrado de contado dentro de quinto día hábil siguiente al remate mediante consignación en la cuenta corriente del Tribunal. Escritura de adjudicación deberá ser firmada por el adjudicatario dentro del plazo de treinta días hábiles contados desde la fecha del remate. Demás antecedentes en las bases de remate y en causa ejecutiva Rol: C-1415-2021, caratulados: Banco de Chile/Ñiripil. Secretaria (s).`;
const textoEconomico1 = `1`

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
    }else if(command.includes('--testEconomico')){
        await testConEconomico();
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


async function testConEconomico(){
    const link = 'https://capitalremates.cl/remates/2335-casa-paine';
    const caso1 = new Caso();
    const normText = normalizeDescription(textoEconomico);
    caso1.texto = normText;
    procesarDatosRemate(caso1);

    const remate = await CapitalRemates.fetchSingleLink(link);
    const fecha = "2026-04-24 15:00:00"
    const caso2 = CapitalRemates.parseDataFromRemate(remate, fecha);

    const remates = new map();
    const k1 = `${caso1.causa}|${caso1.juzgado}`;
    const k2 = `${caso2.causa}|${caso2.juzgado}`;
}

main();



