const { debug } = require("request");

const DESARROLLO = true;
const TESTPJUD = true;

const config = {
    DESARROLLO: {
        env: 'desarrollo',
        cambiarDias: false,
        probarFuncionalidades: false,
        debug: true,
    },
    TESTPJUD:{
        env: 'testPjud',
        cambiarDias: false,
        probarFuncionalidades: true,
        debug: true,
    },
    PRODUCCION: {
        env: 'produccion',
        cambiarDias: true,
        probarFuncionalidades: false,
        debug: false,
    }

}





module.exports = config['PRODUCCION'];
// exports.DESARROLLO = DESARROLLO;
// exports.TESTPJUD = TESTPJUD;