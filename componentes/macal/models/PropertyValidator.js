// models/Property.js
const Joi = require('joi');

class Property {
    constructor(data) {
        const { error, value } = Property.validationSchema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            throw new Error(`Property validation error: ${error.details.map(d => d.message).join(', ')}`);
        }

        Object.assign(this, value);
    }

    static validationSchema = Joi.object({
        id: Joi.number().integer().positive().required(),
        operational_id: Joi.number().integer().positive().required(),
        suspended: Joi.boolean().required(),
        property_name: Joi.string().trim().min(1).max(500).required(),
        property_type: Joi.string().valid(
            'RESIDENCIAL', 'OFICINA', 'CASA', 'DEPARTAMENTO',
            'INDUSTRIAL', 'LOCAL COMERCIAL', 'PARCELA', 'TERRENO','EQUIPAMIENTO',
            'ACTIVIDADES PRODUCTIVAS'
        ).required(),

        // Location
        property_location: Joi.object({
            commune: Joi.string().trim().required(),
            city: Joi.string().trim().required(),
            region: Joi.string().trim().required(),
            lat: Joi.number().min(-90).max(90).required(),
            lng: Joi.number().min(-180).max(180).required(),
            location: Joi.string().trim().required()
        }).required(),

        // Price
        property_price: Joi.object({
            price: Joi.number().positive().required(),
            price_type: Joi.string().valid('UF', 'PESOS').required()
        }).required(),

        // Auction
        auction: Joi.object({
            auction_date: Joi.date().iso().required()
        }).required(),

        // Dimensions
        property_dimensions: Joi.alternatives().try(
            Joi.string().trim().optional(),
            Joi.valid(null)
        ),

        // Additional fields
        warranty_price: Joi.number().positive().optional(),
        featured_photo: Joi.object({
            url_image: Joi.string().uri().optional()
        }).optional(),

        metro: Joi.boolean().optional(),
        outstanding: Joi.boolean().optional(),
        visit_available: Joi.string().optional().allow(null),

        // Computed fields
        computed: Joi.object({
            area_square_meters: Joi.alternatives().try(
                Joi.string().optional(),
                Joi.valid(null)
            ),
            is_metro_nearby: Joi.boolean().optional(),
            auction_days_remaining: Joi.number().integer().optional()
        }).optional()
    });

    // Métodos de instancia
    getAreaInSquareMeters() {
        if (this.computed?.area_square_meters) {
            return this.computed.area_square_meters;
        }

        if(this.property_dimensions == null){
            return null;
        }
        const match = this.property_dimensions.match(/([\d\.]+)\s*(m2|ha)/);
        if (!match) return null;

        const value = parseFloat(match[1]);
        const unit = match[2];

        return unit === 'ha' ? value * 10000 : value;
    }

    getDaysUntilAuction() {
        const auctionDate = new Date(this.auction.auction_date);
        const today = new Date();
        const diffTime = auctionDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    isAuctionUpcoming(daysThreshold = 30) {
        return this.getDaysUntilAuction() <= daysThreshold;
    }

    toJSON() {
        return {
            ...this,
            computed: {
                area_square_meters: this.property_dimensions,
                auction_days_remaining: this.getDaysUntilAuction(),
                is_metro_nearby: this.metro || false,
                is_auction_upcoming: this.isAuctionUpcoming()
            }
        };
    }
}

module.exports = Property;