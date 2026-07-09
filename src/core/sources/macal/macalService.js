// services/propertyService.js
const HttpClient = require('./httpClient.js');
// const PropertyParser = require('../parsers/propertyParser');
const apiConfig = require('./apiConfig.js');
const logger = require('#utils/logger.js');
const PropertyParser = require('./parser.js');
const {delay} = require('#utils/delay.js');
const {stringToDate} = require('#utils/cleanStrings.js');
const CasoBuilder = require('#models/caso/casoBuilder.js');
const { all } = require('axios');


const config = require('#config');
const Caso = require('#models/caso/caso.js');
const { NormalModuleReplacementPlugin } = require('webpack');

const MACAL = config.MACAL;

class MacalService {
    constructor() {
        this.httpClient = new HttpClient(
            apiConfig.baseURL,
            apiConfig.timeout,
            apiConfig.retries
        );
        this.defaultParams = apiConfig.defaultParams;
        this.endpoints = apiConfig.endpoints;
        this.MAX_PAGES = 50; 
        this.DELAY_BETWEEN_REQUESTS = 1000; 
    }

    async searchProperties(options = {}) {
        const filterProperties = [];
        try {
            const currentPage = options.page || 1;
            const params = {
                ...this.defaultParams,
                ...options
            };

            // logger.info('Fetching properties with params:', params);

            const apiResponse = await this.httpClient.get(
                apiConfig.endpoints.properties.search.replace('{page}', currentPage),
                params
            );

            const parsedData = PropertyParser.parseApiResponse(apiResponse);

            // logger.info(`Successfully parsed ${parsedData.properties.length} properties`);
            // for(let prop of parsedData.properties){
            //     // logger.info(`Property: ${prop.id} - ${prop.property_name} - ${prop.auction.auction_date} Page : ${currentPage}`);
            // }

            for(let prop of parsedData.properties){
                const details = await this.searchSinglePropertyById(prop.id);
                await delay(500); // Pequeña espera para no saturar el servidor
                const enrichedProp = await PropertyParser.enrichPropertyDetails(prop,details);
                if(enrichedProp && (enrichedProp.disponibilidad == 'DESOCUPADA' || enrichedProp.disponibilidad == "DESOCUPADA SIN LLAVES") ){
                    filterProperties.push(enrichedProp);
                }
            }

            return {
                properties : filterProperties,
                pagination : parsedData.pagination,
            }
        } catch (error) {
            logger.error('Property service search error:', error);
            throw this.enhanceError(error);
        }
    }

    async getPropertiesUntilDate(cutOffDate, options = {}) {
        const cutoff = new Date(cutOffDate);
        const allProperties = [];
        let currentPage = 1;
        let hasMorePages = true;
        let reachedCutoff = false;

        while(hasMorePages && !reachedCutoff && currentPage <= this.MAX_PAGES){
            try{
                const result = await this.searchProperties({
                    ...options,
                    page: currentPage
                });

                const { shouldStop, properties } = this.filterPropertiesByDate(
                    result.properties,
                    cutoff,
                    currentPage
                );

                allProperties.push(...properties);
                reachedCutoff = shouldStop;

                // Verificar paginación
                hasMorePages = this.hasMorePages(result.pagination);
                if (hasMorePages && !reachedCutoff) {
                    await delay(this.DELAY_BETWEEN_REQUESTS);
                }
                currentPage++;
            }catch(error){
                logger.error('Error fetching paginated properties:', error);
                throw this.enhanceError(error);
            }
        }

        logger.info(`Fetched total ${allProperties.length} properties until cutoff date ${cutoff.toISOString()}`);

        const casos = this.transformToCasos(allProperties);
        return casos;
    }

    filterPropertiesByDate(properties, cutoffDate, currentPage) {
        const filteredProperties = [];
        let shouldStop = false;

        for (const property of properties) {
            const fixedAuctionDate = stringToDate(property.auction.auction_date);
            fixedAuctionDate.setHours(0);

            if (fixedAuctionDate <= cutoffDate || currentPage < 5) {
                filteredProperties.push(property);
            } else {
                // console.log(`Se llego a la fecha limite con ${cutoffDate} en ${property}`);
                shouldStop = true;
                break;
            }

        }
        // if ( !shouldStop) {
        //     console.log('Cantidad de propiedades filtradas ', filteredProperties.length)
        //     shouldStop = true;
        // }

        return { shouldStop, properties: filteredProperties };
    }

    hasMorePages(pagination) {
        return pagination.current_page < pagination.total_pages;
    }

    async searchPropertiesWithFilters(filters = {}) {
        const {
            page = 1,
            per_page = 18,
            commune,
            property_type,
            price_min,
            price_max,
            ...otherFilters
        } = filters;

        const params = {
            page,
            per_page,
            ...otherFilters
        };

        // Construir filtros complejos si es necesario
        if (commune) params.commune = commune;
        if (property_type) params.property_type = property_type;

        return this.searchProperties(params);
    }

    async getPropertiesByCommune(commune, options = {}) {
        const normalizedCommune = commune.toUpperCase().trim();
        return this.searchPropertiesWithFilters({
            ...options,
            commune: normalizedCommune
        });
    }

    async getUpcomingAuctions(daysThreshold = 30, options = {}) {
        const allProperties = await this.searchProperties(options);

        const upcomingProperties = allProperties.properties.filter(property =>
            property.isAuctionUpcoming(daysThreshold)
        );

        return {
            ...allProperties,
            properties: upcomingProperties,
            metadata: {
                ...allProperties.metadata,
                days_threshold: daysThreshold,
                upcoming_count: upcomingProperties.length
            }
        };
    }

    async searchSinglePropertyById(propertyId) {
        const params = {
            ...this.defaultParams,
            id: propertyId
        };

        
        try {
            const apiResponse = await this.httpClient.get(
                this.endpoints.properties.details.replace('{id}', propertyId),
                params
            );
            return apiResponse;
        }catch (error) {
            logger.error(`Error fetching property with ID ${propertyId}:`, error);
            throw this.enhanceError(error);
        }

    }
    enhanceError(error) {
        // Mejorar mensajes de error para el cliente
        if (error.status === 404) {
            error.message = 'Properties API endpoint not found';
        } else if (error.status === 429) {
            error.message = 'Rate limit exceeded for properties API';
        } else if (error.message.includes('Network Error')) {
            error.message = 'Unable to connect to properties API. Please check your internet connection.';
        }

        error.isOperational = true;
        return error;

    }

    /* TODO :   juzgado,  
                ocupacino, 
                dato,  R
                precio minimo,  R
                mapa
                Causa

    */
    transformToCasos(allProperties) {

        const casos = [];
        for (let property of allProperties) {
            let comuna, lat, long, mapa, rolPropiedad, causaPropiedad, juzgado = null;


            const link = `https://www.macal.cl/propiedades/${property.id}`;

            const caso = new CasoBuilder(new Date(),link, MACAL).construir();

            if (property.other_features) {
                const rol = property.other_features.find(feat => feat.label.toLowerCase().includes('rol de '));
                if (rol) {
                    rolPropiedad = rol.value;
                    caso.rolPropiedad = rol.value
                }

                const causa = property.other_features.find(feat => feat.label.toLowerCase().includes('causa'));
                if (causa) {
                    causaPropiedad = causa.value;
                    caso.causa = causa.value
                }

                const mandante = property.other_features.find(feat => feat.label.toLowerCase().includes('mandante'));
                if(mandante){
                    juzgado = mandante.value;
                    caso.juzgado = mandante.value
                }

                const estado_ocupacion = property.other_features.find(feat => feat.label.toLowerCase().includes('disponibilidad'));
                if(estado_ocupacion){
                    // writeLine(ws, `${config.OCUPACION}`, currentRow, estado_ocupacion.value, 's');
                    // console.log('OCUPACION: ', estado_ocupacion);

                }
            }
            if (property.property_location) {
                const location = property.property_location;
                caso.comuna = location.commune
                lat = location.lat || null;
                long = location.lng || null;
                logger.debug(`caso: ${property.id} location: ${JSON.stringify(location, null, 2)} lat ${lat} y long ${long}`);
                if (lat && long) {
                    const link = `https://www.google.com/maps/place/${lat},${long}`;
                    caso.linkMap =link; 
                    // logger.debug(`Con link = ${caso.linkMap} y el origianl= ${link}`)
                    // logger.info(`${JSON.stringify(caso.toObject(),null,2)}`)
                }
            }
            caso.fechaRemate = stringToDate(property.auction.auction_date);
            caso.montoMinimo = property.property_price.price
            caso.metros = this.createFeaturesSummary(property.general_features);
            caso.direccion = property.property_name

            // const buildCaso = caso.construir();

            // logger.info(`Caso: ${JSON.stringify(caso, null, 2)}`);

            casos.push(caso);
        }

        return casos;
    }

    createFeaturesSummary(generalFeatures) {
        if (!Array.isArray(generalFeatures)) return '';

        const features = {};
        const mappings = {
            'dormitorio': 'd', 'dormitorios': 'd',
            'baño': 'b', 'baños': 'b', 'bano': 'b', 'banos': 'b',
            'estacionamiento': 'est',
            'bodega': 'bod',
            'superficie': 'm2', 'superficie útil': 'm2', 'terreno': 'm2'
        };

        generalFeatures.forEach(({ label, value }) => {
            const labelLower = label?.toLowerCase();
            if (!labelLower || !value) return;

            for (const [key, abbr] of Object.entries(mappings)) {
                if (labelLower.includes(key)) {
                    if (abbr === 'm2') {
                        // Para metros: limpiar y mantener formato
                        if(value.toLowerCase().includes('m2')){
                            const cleanValue = value.replace(/[^\d\s]2/g, '').trim();
                            features[abbr] = cleanValue ? cleanValue + 'm2' : value;
                        }else{
                            // console.log(`Parsing superficie value without m2: ${value} y label: ${label}`);
                            const numericValue = value.replace(/,/,'.').replace(/[^\d\.]/g, '');
                            // console.log(`Parsed superficie numeric value: ${numericValue}`);
                            if (numericValue) features[abbr] = numericValue + 'ha';
                        }
                    } else {
                        // Para otras: solo el número
                        const numericValue = value.replace(/[^\d]/g, '').replace(/,/,'.');
                        // console.log(`Parsed feature ${abbr}: ${numericValue}`);
                        if (numericValue) features[abbr] = numericValue + abbr;
                    }
                    break;
                }
            }
        });

        return ['d', 'b', 'est', 'bod', 'm2']
            .map(abbr => features[abbr])
            .filter(Boolean)
            .join('-');
    }
}

module.exports = new MacalService();