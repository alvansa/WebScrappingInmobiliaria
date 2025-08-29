
require('dotenv').config();
const DESARROLLO = true;
const TESTPJUD = true;

const LETRAS = {
    INICIO : 'A',
    ESTADO :'B',
    FECHA_DESC : 'C',
    ORIGEN : 'D',
    NOTAS : 'E',
    FECHA_REM : 'F',
    HORA_REMATE : 'G',
    OCUPACION : 'H',
    MARTILLERO : 'I',
    DIRECCION : 'J',
    CAUSA : 'K',
    TRIBUNAL : 'L',
    COMUNA_TRIBUNAL : 'M',
    COMUNA : 'N',
    ANNO : 'O',
    PARTES : 'P',
    DATO : 'Q',
    VV_O_CUPON : 'R',
    PORCENTAJE : 'S',
    PLAZOVV : 'T',
    CONTR_Y_ASEO : 'U',
    GGCC : 'V',
    DEUDA2 : 'W',
    DEUDA3 : 'X',
    ROL : 'Y',
    NOTIFICACION : 'Z',
    PRECIO_MINIMO : 'AA',
    PRECIO_MINIMO2 : 'AB',
    PRECIO_MINIMO3 : 'AC',
    PRECIO_MINIMO4 : 'AD',
    AVALUO_FISCAL : 'AE',
    AVALUO_FISCAL2 : 'AF',
    ESTADO_CIVIL : 'AG',
    PX_COMPRA : 'AH',
    ANNO_COMPRA : 'AI',
    PRECIO_VENTA_POS : 'AJ',
    PRECIO_VENTA_NOS : 'AK',
    PRECIO_VENTA_ENCONTRADO : 'AL',
    POSTURA_MAXIMA : 'AM',
    PORCENTAJE_POSTURA : 'AN',
    UF_M : 'AO',
    BLANCO : 'AP',
    DEUDA_BANCO : 'AQ',
    DEUDA_HIPOTECA : 'AR',
    DEUDA_PAGARE : 'AS',
    DEUDA_TGR : 'AT',
    OTRA_DEUDA : 'AU',
    DEUDA_BANCO2 : 'AV',
    DEUDA_BANCO3 : 'AW',
    COMENTARIOS1 : 'AX',
    COMENTARIOS2 : 'AY',
    COMENTARIOS3 : 'AZ',
}

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
    ...LETRAS
};


module.exports = config;

// exports.TESTPJUD = TESTPJUD;