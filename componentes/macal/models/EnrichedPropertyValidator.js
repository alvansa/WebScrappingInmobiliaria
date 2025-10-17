const Joi = require('joi');
const Property = require('./PropertyValidator.js');

class EnrichedProperty extends Property {
    constructor(data) {
        const {error, value} = EnrichedProperty.enrichedValidationSchema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            throw new Error(`EnrichedProperty validation error: ${error.details.map(d => d.message).join(', ')}`);
        }
        
        super(value);
        Object.assign(this, value);
    }

    static enrichedValidationSchema = Property.validationSchema.keys({
        url_warranty: Joi.string().uri().required(),
        description : Joi.string().trim().max(20000).required(),
        
        //Features like dorms, baths, parking, etc.
        general_features: Joi.array().items(
            Joi.object({
                label: Joi.string().trim().required(), 
                value: Joi.string().trim().required(),
                id:Joi.alternatives().try(
                    Joi.string().trim().optional(),
                    Joi.valid(null)
                ) 
            })
        ).min(0).optional().allow(null),

        //features like occupation,rol, etc.
        other_features: Joi.array().items(
            Joi.object({
                label: Joi.string().trim().required(),
                value: Joi.string().trim().required(),
                id:Joi.alternatives().try(
                    Joi.string().trim().optional(),
                    Joi.valid(null)
                ) 
            })
        ).min(0).optional().allow(null),
        disponibilidad: Joi.string().trim().allow(null).max(500).optional()
    });

    toJson() {
        return JSON.stringify(this);
    }
}

module.exports = EnrichedProperty;