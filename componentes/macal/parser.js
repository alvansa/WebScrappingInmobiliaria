// parsers/propertyParser.js
const Property = require('./PropertyValidator.js');
const logger = require('../../utils/logger.js');

class PropertyParser {
    static parseApiResponse(apiResponse) {
        try {
            const { entries, total_entries, per_page, current_page, filters } = apiResponse;

            const parsedProperties = entries.map(entry =>
                this.parsePropertyEntry(entry)
            ).filter(Boolean); // Remove null entries from failed parsing

            const pagination = {
                total: total_entries,
                per_page,
                current_page,
                total_pages: Math.ceil(total_entries / per_page)
            };

            const availableFilters = this.parseFilters(filters);

            return {
                properties: parsedProperties,
                pagination,
                filters: availableFilters,
                metadata: {
                    parsed_at: new Date().toISOString(),
                    total_parsed: parsedProperties.length,
                    has_filters: apiResponse.hasFilters || false
                }
            };
        } catch (error) {
            logger.error('Error parsing API response:', error);
            throw new Error(`Failed to parse API response: ${error.message}`);
        }
    }

    static parsePropertyEntry(entry) {
        try {
            // Transformación y enriquecimiento de datos
            const transformedData = {
                ...entry,

                // Normalizar nombres de campos
                property_name: entry.property_name?.trim(),

                // Enriquecer datos de ubicación
                property_location: {
                    ...entry.property_location,
                    normalized_commune: this.normalizeText(entry.property_location?.commune),
                    normalized_city: this.normalizeText(entry.property_location?.city)
                },

                // Calcular campos computados
                computed: {
                    area_square_meters: this.parseAreaToSquareMeters(entry.property_dimensions),
                    auction_days_remaining: this.calculateDaysUntilAuction(entry.auction?.auction_date),
                    has_visit_available: Boolean(entry.visit_available),
                    is_metro_nearby: entry.metro || false
                }
            };

            return new Property(transformedData);
        } catch (error) {
            logger.warn('Failed to parse property entry:', {
                id: entry.id,
                error: error.message,
                entry: JSON.stringify(entry).substring(0, 200) // Log partial entry for debugging
            });
            return null;
        }
    }

    static parseFilters(filters) {
        if (!filters || !Array.isArray(filters)) return {};

        const parsedFilters = {};

        filters.forEach(filter => {
            if (!filter.filter || !filter.values) return;

            parsedFilters[filter.filter] = {
                label: filter.label,
                type: filter.type,
                collapsable: filter.collapsable,
                values: filter.values.map(value => ({
                    label: this.cleanHtmlEntities(value.label),
                    value: value.value,
                    count: value.count || 0
                }))
            };
        });

        return parsedFilters;
    }

    static parseAreaToSquareMeters(dimensions) {
        if (!dimensions) return null;

        try {
            const match = dimensions.match(/([\d\.]+)\s*(m2|ha)/i);
            if (!match) return null;

            const value = parseFloat(match[1]);
            const unit = match[2].toLowerCase();

            if (unit === 'ha') {
                return value * 10000; // Convert hectares to m²
            }

            return value;
        } catch (error) {
            logger.warn(`Failed to parse dimensions: ${dimensions}`, error);
            return null;
        }
    }

    static calculateDaysUntilAuction(auctionDate) {
        if (!auctionDate) return null;

        try {
            const auction = new Date(auctionDate);
            const today = new Date();
            const diffTime = auction - today;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            logger.warn(`Failed to calculate days until auction: ${auctionDate}`, error);
            return null;
        }
    }

    static normalizeText(text) {
        return text?.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
    }

    static cleanHtmlEntities(text) {
        return text?.replace(/&(#?\w+);/g, (match, entity) => {
            if (entity === 'amp') return '&';
            if (entity === 'lt') return '<';
            if (entity === 'gt') return '>';
            if (entity === 'quot') return '"';
            if (entity === '#39') return "'";
            if (entity === '#178') return '²';
            return match;
        }) || '';
    }
}

module.exports = PropertyParser;