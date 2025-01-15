const {PreRemates} = require('./obtenerPublicaciones');
const config  =  require("../../config.js");

async function main(){
    const EMAIL = config.EMAIL;
    const PASSWORD = config.PASSWORD;
    try{
        const preRemates = new PreRemates(EMAIL,PASSWORD);
       const casos = await preRemates.getRemates();
        const casosObj = casos.map((caso) => caso.toObject());
        console.log("Casos: ",casosObj);
    }catch(error){
        console.error('Error al obtener resultados:', error);
    }
}

main();