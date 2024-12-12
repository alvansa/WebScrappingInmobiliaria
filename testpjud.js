const {getPJUD,getEspecificDataFromPjud,datosFromPjud} = require('./Model/getPjud');

async function main(){
    
    let fechaDesde = '14/11/2024';
    let fechaHasta = '15/11/2024';
    const tabla = [];
    let data = await datosFromPjud(fechaDesde,fechaHasta);
    // console.log(data);
    if(data){
        console.log('Datos conseguidos');
        console.log(data);
    }else{
        console.log('Error al conseguir datos');
    }
}

main();