const DataInmobiliaria = require('./obtainDataInmobilaria');

async function main(){
    const comuna = 'Curacaví';
    // const rol = '00063-00012';
    const rol = '63-12'
    const metros = await DataInmobiliaria.obtenerMetrosTotales(comuna,rol);
    console.log(metros);
}

main();