const {getPJUD} = require('./Model/getPjud');

async function main(){
    let fechaDesde = '13/11/2024';
    let fechaHasta = '15/11/2024';
    let data = await getPJUD(fechaDesde,fechaHasta);
    // console.log(data);
    console.log("datos conseguidos");
}

main();