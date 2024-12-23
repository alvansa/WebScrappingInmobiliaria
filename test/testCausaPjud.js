const {getConsultaCausaPjud} = require('../Model/consultaCausaPjud');
const Caso  = require('../Model/caso');


function crearCasosPrueba(){
    const casos = [];
    const caso1 = new Caso(new Date(),new Date(),)
    caso1.darJuzgado("7º JUZGADO CIVIL DE SANTIAGO");
    caso1.darCausa("C-5336-2022");
    caso1.darFechaRemate("02/12/2024 15:30");
    casos.push(caso1);

    return casos;
}


async function main(){
    let fechaDesde = '30/11/2024';
    let fechaHasta = '03/12/2024';
    const casos = crearCasosPrueba();
    try{
        const data = await getConsultaCausaPjud(casos);
        if(data){
            console.log('Datos conseguidos exitosamente: ',data.length);
            const datos = data.map(caso => caso.toObject());
            console.log('Datos: ',datos);
        }else{
            console.log('Error al conseguir datos');
        }
    }catch(error){
        console.error('Error al obtener resultados:', error);
    }
}


main();