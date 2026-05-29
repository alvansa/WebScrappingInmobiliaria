const comunas = require("./comunas");
const { normalizeText } = require("../../utils/textNormalizers");
const logger = require("../../utils/logger");

class dataInmobiliaria {
    /*
     * devuelve un numero con la cantidad de metros utiles.
     * @{comuna} string con el nombre de la comuna, puede tener o no tilde, mayuscula o minuscula.
     * @{rol} string con el formato 'manzana-predio', ejemplo '3800-185'
     */

    static async obtainData(comuna, rol){
        try{
            const parameters = this.parseParamenters(comuna, rol);
            const codComuna = parameters[0]
            const manzana = parameters[1]
            const predio = parameters[2]

            const data = await this.fetchApi(codComuna, manzana, predio);
            logger.info('b')
            console.log(JSON.stringify(data,null,2));

            const metros = await this.obtenerMetrosTotales(data,rol);
            logger.info('c')

            const linkMap = await this.obtenerLinkMap(data);
            logger.info('d')

            return {
                'metros': metros,
                'linkMap': linkMap
            }

        }catch(error){
            logger.error(`DataInmobiliaria: Error obteniendo datos para comuna ${comuna} y rol ${rol}: ${error.message}`);
            return null;
        }
    }

    static parseParamenters(comuna, rol){
        const normalizedComuna = this.normalizeComuna(comuna);
        const codeComuna = this.getCodeComuna(normalizedComuna);
        const [manzana, predio] = rol.split("-");
        return [codeComuna, manzana, predio];
    }
    static async obtenerMetrosUtiles(comuna, rol) {
        const normalizedComuna = this.normalizeComuna(comuna);
        const codeComuna = this.getCodeComuna(normalizedComuna);
        const [manzana, predio] = rol.split("-");
        const data = await this.fetchApi(codeComuna, manzana, predio);
        if (!data) {
            return null;
        }
        if (data.detalle_construccion) {
            const metros = data.detalle_construccion[0].superficie_m2;
            // console.log(`Metros obtenidos para rol ${rol}: ${metros}`);
            return Number(metros);
        }
    }
    /*
        devuelve un numero con la cantidad de metros de superficie, si es departamento o 0, devuelve 0.
    */
    static async obtenerMetrosSuperficie(comuna, rol) {
        const codeComuna = this.getCodeComuna(comuna);
        const [manzana, predio] = rol.split("-");
        const data = await this.fetchApi(codeComuna, manzana, predio);
        if (!data) {
            return null;
        }
        if (data.superficie_terreno_m2) {
            const metros = data.superficie_terreno_m2;
            return Number(metros);
        }
    }
    /*
        devuelve un string con la forma 'metros utiles - metros superficie - metros totales'
    */
    static async obtenerMetrosTotales(data,rol) {
        let metrosUtiles = null;
        let metrosTerreno = null;
        if (data.detalle_construccion) {
            for (let singleData of data.detalle_construccion) {
                metrosUtiles += singleData.superficie_m2;
            }
        }
        if (data.superficie_terreno_m2) {
            metrosTerreno = data.superficie_terreno_m2;
        }

        if (metrosUtiles && metrosTerreno) {
            logger.info(
                `Metros obtenidos para rol ${rol}: ${metrosUtiles}-${metrosTerreno}`,
            );
            return `${metrosUtiles}-${metrosTerreno}`;
        } else if (metrosUtiles) {
            return `${metrosUtiles} utiles`;
        } else if (metrosTerreno) {
            return `${metrosTerreno} terreno`;
        }
    }

    static async obtenerLinkMap(data) {
        if (data.latitud && data.longitud) {
            const latitud = data.latitud;
            const longitud = data.longitud;
            const linkMap = `https://www.google.com/maps?q=${latitud},${longitud}`;
            return linkMap;
        }
        return null;
    }

    static async fetchApi(codComuna, manzana, predio) {
        const url = `https://datainmobiliaria.cl/reports/detalle_propiedad_data_mongo?cod_com=${codComuna}&cod_mz=${manzana}&cod_pr=${predio}`;
        try {
            const response = await fetch(url);
            const dataBase = await response.json();
            console.log(JSON.stringify(dataBase,null,2))
            if (dataBase && dataBase.data) {
                return dataBase.data;
            }
        } catch (error) {
            console.error(`Error al obtener metros para rol ${rol}:`, error);
            console.log('Retornando nulo')
            return null;
        }
    }
    static getCodeComuna(comuna) {
        const comunaNormalized = this.normalizeComuna(comuna);
        return comunas[comunaNormalized];
    }

    static normalizeComuna(comuna) {
        const normalizedComuna = normalizeText(comuna).toUpperCase();

        return normalizedComuna;
    }
}

module.exports = dataInmobiliaria;
