// services/propertyService.js
const HttpClient = require('./httpClient.js');
// const PropertyParser = require('../parsers/propertyParser');
const apiConfig = require('./apiConfig.js');
const logger = require('../../utils/logger.js');
const PropertyParser = require('./parser');

class MacalService {
    constructor() {
        this.httpClient = new HttpClient(
            apiConfig.baseURL,
            apiConfig.timeout,
            apiConfig.retries
        );
        this.defaultParams = apiConfig.defaultParams;
        this.endpoints = apiConfig.endpoints;
    }

    async searchProperties(options = {}) {
        try {
            const params = {
                ...this.defaultParams,
                ...options
            };

            logger.info('Fetching properties with params:', params);

            const apiResponse = await this.httpClient.get(
                apiConfig.endpoints.properties.search,
                params
            );

            const parsedData = PropertyParser.parseApiResponse(apiResponse);

            logger.info(`Successfully parsed ${parsedData.properties.length} properties`);
            for(let prop of parsedData.properties){
                logger.info(`Property: ${prop.property_name}, Id: ${prop.id}, Location: ${prop.property_location?.commune}, Price: ${prop.price}`);
            }


            return parsedData;
        } catch (error) {
            logger.error('Property service search error:', error);
            throw this.enhanceError(error);
        }
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
        logger.debug('Search filters:', filters);

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
}

module.exports = new MacalService();