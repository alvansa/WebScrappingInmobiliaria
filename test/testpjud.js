const {getPJUD,getEspecificDataFromPjud,datosFromPjud} = require('../Model/getPjud');

async function main(){
    
    let fechaDesde = '30/11/2024';
    let fechaHasta = '03/12/2024';
    const tabla = [];
    let data = await datosFromPjud(fechaDesde,fechaHasta);
    // console.log(data);
    if(data){
        console.log('Datos conseguidos: ',data.length);
        const datos = data.map(caso => caso.toObject());
        console.log('Datos: ',datos);
    }else{
        console.log('Error al conseguir datos');
    }
}

main();