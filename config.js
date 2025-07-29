
require('dotenv').config();
const DESARROLLO = true;
const TESTPJUD = true;

const baseConfig = {
    EMOL: 1,
    PJUD: 2,
    LIQUIDACIONES: 3,
    PREREMATES: 4,
    OTROS: 0,
}

const environmentConfig = {
    DESARROLLO: {
        env: 'desarrollo',
        cambiarDias: false,
        probarFuncionalidades: false,
        debug: true,
        EMAIL : process.env.EMAIL ? process.env.EMAIL : null,
        PASSWORD : process.env.PASSWORD ? process.env.PASSWORD : null,
    },
    TESTPJUD:{
        env: 'testPjud',
        cambiarDias: false,
        probarFuncionalidades: true,
        debug: true,
        EMAIL : process.env.EMAIL ? process.env.EMAIL : null,
        PASSWORD : process.env.PASSWORD ? process.env.PASSWORD : null,

    },
    PRODUCCION: {
        env: 'produccion',
        cambiarDias: true,
        probarFuncionalidades: false,
        debug: false,
        EMAIL : process.env.EMAIL ? process.env.EMAIL : null,
        PASSWORD : process.env.PASSWORD ? process.env.PASSWORD : null,
        
    }
}

const config = {
    ...baseConfig,
    ...environmentConfig.DESARROLLO,
};


module.exports = config;

// exports.TESTPJUD = TESTPJUD;