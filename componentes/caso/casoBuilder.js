const { getCausaVoluntaria } = require('../economico/datosRemateEmol');
const Caso = require('./caso');

class CasoBuilder{
    constructor(fechaObtencion,link,origen){
        this.caso = new Caso(fechaObtencion,null,link,origen);
    }

    conCausa(causa){
        this.caso.causa = causa;
        return this;
    }

    conJuzgado(juzgado){
        this.caso.juzgado = juzgado;
        return this;
    }

    conNumeroCorte(numero,corte){
        this.caso.numeroJuzgado = numero;
        this.caso.corte = corte;
        return this;
    }

    conPartes(partes){
        this.caso.partes = partes;
        return this;
    }

    conExcel(causa,juzgado,partes){
        this.caso.causa = causa;
        this.caso.juzgado = juzgado;
        this.caso.partes = partes;
        return this;
    }

    conFechaRemate(fechaRemate){
        this.caso.fechaRemate = fechaRemate;
        return this;
    }

    conOrigen(origen){
        this.caso.origen = origen;
        return this;
    }
    conComuna(comuna){
        this.caso.comuna = comuna;
        return this;
    }
    conRol(rol){
        this.caso.rolPropiedad = rol;
        return this;
    }
    conAvaluoFiscal(avaluoFiscal){
        this.caso.avaluoFiscal = avaluoFiscal;
        return this;
    }
    conMapaSII(mapaSII){
        this.caso.mapaSII = mapaSII;
        return this;
    }

    construir(){
        return this.caso;
    }

}

module.exports = CasoBuilder;