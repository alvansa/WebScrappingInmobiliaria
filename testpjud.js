const {getPJUD,getEspecificDataFromPjud} = require('./Model/getPjud');

async function main(){
    let fechaDesde = '13/11/2024';
    let fechaHasta = '15/11/2024';
    const tabla = [];
    let data = await getEspecificDataFromPjud(tabla);
    // console.log(data);
    if(data){
        console.log('Datos conseguidos');
        console.log(data);
    }else{
        console.log('Error al conseguir datos');
    }
}

main();