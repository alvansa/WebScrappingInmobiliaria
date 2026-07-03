
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
    OCUPACION2 : 'I',
    MARTILLERO : 'J',
    DIRECCION : 'K',
    CAUSA : 'L',
    TRIBUNAL : 'M',
    COMUNA_TRIBUNAL : 'N',
    COMUNA : 'O',
    ANNO : 'P',
    PARTES : 'Q',
    DATO : 'R',
    VV_O_CUPON : 'S',
    PORCENTAJE : 'T',
    PLAZOVV : 'U',
    CONTR_Y_ASEO : 'V',
    GGCC : 'W',
    DEUDA2 : 'X',
    DEUDA3 : 'Y',
    ROL : 'Z',
    NOTIFICACION : 'AA',
    PRECIO_MINIMO : 'AB',
    PRECIO_MINIMO2 : 'AC',
    PRECIO_MINIMO3 : 'AD',
    PRECIO_MINIMO4 : 'AE',
    AVALUO_FISCAL : 'AF',
    AVALUO_FISCAL2 : 'AG',
    ESTADO_CIVIL : 'AH',
    PX_COMPRA : 'AI',
    ANNO_COMPRA : 'AJ',
    PRECIO_VENTA_POS : 'AK',
    PRECIO_VENTA_NOS : 'AL',
    PRECIO_VENTA_ENCONTRADO : 'AM',
    PRECIO_VENTA_DATA : 'AN',
    POSTURA_MAXIMA : 'AO',
    PORCENTAJE_POSTURA : 'AP',
    UF_M : 'AQ',
    BLANCO : 'AR',
    DEUDA_BANCO : 'AS',
    DEUDA_HIPOTECA : 'AT',
    DEUDA_PAGARE : 'AU',
    DEUDA_TGR : 'AV',
    LINK_MAP : 'AW',
    LINK_DATA : 'AX',
    DEUDA_BANCO3 : 'AY',
    COMENTARIOS1 : 'AZ',
    COMENTARIOS2 : 'BA',
    COMENTARIOS3 : 'BB',
}

// Funciones utilitarias
const funcionesColumnas = {
    // Obtener número desde clave
    obtenerNumero(clave) {
        const letras = Object.values(LETRAS);
        const letra = LETRAS[clave];
        return letras.indexOf(letra);
    },
    
    // Obtener letra desde número
    obtenerLetra(numero) {
        const letras = Object.values(LETRAS);
        return letras[numero] || null;
    },
    
    // Obtener referencia Excel (A1, B2, etc.)
    obtenerReferencia(clave, fila = 1) {
        const letra = LETRAS[clave];
        const numero = this.obtenerNumero(clave);
        return `${letra}${fila + numero}`;
    },
    
    // Obtener todas las letras con sus números
    obtenerTodasLasColumnas() {
        return Object.keys(LETRAS).map(clave => ({
            clave,
            letra: LETRAS[clave],
            numero: this.obtenerNumero(clave)
        }));
    },
    
    // Buscar clave por letra
    obtenerClavePorLetra(letra) {
        return Object.keys(LETRAS).find(clave => LETRAS[clave] === letra);
    }
};

const baseConfig = {
    EMOL: 1,
    PJUD: 2,
    LIQUIDACIONES: 3,
    PREREMATES: 4,
    CAPITALREMATES: 5,
    MACAL: 6,
    OTROS: 0,

    PROPIEDAD : 0,
    ESTACIONAMIENTO : 1,
    BODEGA : 2,
    TODOS : 3,

    NORMAL:0,
    LADRILLERO : 1,
    DEUDA: 2,
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
    ...LETRAS,
    ...funcionesColumnas
};


module.exports = config;

// exports.TESTPJUD = TESTPJUD;