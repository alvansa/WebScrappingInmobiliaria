// services/propertyService.js
const HttpClient = require('./httpClient.js');
// const PropertyParser = require('../parsers/propertyParser');
const apiConfig = require('./apiConfig.js');
const logger = require('../../utils/logger.js');
const PropertyParser = require('./parser');
const {delay} = require('../../utils/delay.js');
const {transformDateString} = require('../../utils/cleanStrings.js');

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

            logger.info('Fetching properties with params:', params);

            const apiResponse = await this.httpClient.get(
                apiConfig.endpoints.properties.search.replace('{page}', currentPage),
                params
            );

            const parsedData = PropertyParser.parseApiResponse(apiResponse);

            logger.info(`Successfully parsed ${parsedData.properties.length} properties`);
            for(let prop of parsedData.properties){

                logger.info(`Property: ${prop.id} - ${prop.property_name} - ${prop.auction.auction_date} Page : ${currentPage}`);
            }
            for(let prop of parsedData.properties){
                const details = await this.searchSinglePropertyById(prop.id);
                await delay(500); // Pequeña espera para no saturar el servidor
                const enrichedProp = await PropertyParser.enrichPropertyDetails(prop,details);
                if(enrichedProp && (enrichedProp.disponibilidad == 'DESOCUPADA' || enrichedProp.disponibilidad == "DESOCUPADA SIN LLAVES") ){
                    filterProperties.push(enrichedProp);
                }
            }

            logger.info('API response and parsing completed successfully all data ',parsedData.properties.length, ' filtrada ',filterProperties.length);
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
                    cutoff
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

        for(let prop of allProperties){
            // logger.info(`Final Property List: ${prop.id} - ${prop.property_name} - ${prop.auction.auction_date} status: ${prop.disponibilidad}`);
            if(prop.id == '76242'){
                logger.info(`Property: ${JSON.stringify(prop, null, 2)}`);
            }
        }
        logger.info(`Fetched total ${allProperties.length} properties until cutoff date ${cutoff.toISOString()}`);

        return {
            properties : allProperties,
            totalPages: currentPage - 1,
            cutoffDate: cutoff
        };


    }

    filterPropertiesByDate(properties, cutoffDate) {
        const filteredProperties = [];
        let shouldStop = false;

        for (const property of properties) {
            const fixedAuctionDate = transformDateString(property.auction.auction_date);
            fixedAuctionDate.setHours(0);

            if (fixedAuctionDate <= cutoffDate) {
                filteredProperties.push(property);
            } else {
                shouldStop = true;
                break;
            }

        }
        if (filteredProperties.length === 0 && !shouldStop) {
            shouldStop = true;
        }

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
        // logger.debug('Search filters:', filters);

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

        logger.info(`Fetching property with ID: ${propertyId}`);
        
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
}

module.exports = new MacalService();