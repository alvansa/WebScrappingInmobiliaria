const {ConsultaCausaPjud} = require('./consultaCausaPjud');
const Caso  = require('../caso/caso');


function crearCasosPrueba(){
    const casos = [];
    const caso1 = new Caso(new Date(),new Date(),)
    caso1.juzgado("7º JUZGADO CIVIL DE SANTIAGO");
    caso1.causa("C-5336-2022");
    caso1.fechaRemate("02/12/2024 15:30");
    casos.push(caso1);

    return casos;
}


async function main(){
    let fechaDesde = '30/11/2024';
    let fechaHasta = '03/12/2024';
    const casos = crearCasosPrueba();
    try{
        const causaPjud = new ConsultaCausaPjud(casos); 
        const data = await causaPjud.getConsultaCausaPjud();
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