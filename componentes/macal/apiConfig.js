// config/api.js
const Joi = require('joi');

const apiConfigSchema = Joi.object({
  baseURL: Joi.string().uri().required(),
  timeout: Joi.number().default(30000),
  retries: Joi.number().default(3),
  rateLimit: Joi.object({
    requests: Joi.number().default(100),
    windowMs: Joi.number().default(15 * 60 * 1000) // 15 minutes
  }),
  endpoints: Joi.object({
    properties: Joi.object({
      search: Joi.string().required(),
      details : Joi.string().required() // Ejemplo de endpoint para detalles de propiedad
    }).required()
  }).required(),
    defaultParams: Joi.object({
    tipoOrden: Joi.number().default(0),
    hasFilters: Joi.boolean().default(false),
    per_page: Joi.number().default(18)
    })
});

const apiConfig = {
  baseURL: 'https://api-net.macal.cl/api/v1',
  timeout: 30000,
  retries: 3,
  endpoints: {
    properties: {
      search: '/properties/search',
      details : '/properties/details?id={id}' // Ejemplo de endpoint para detalles de propiedad
    },

  },
  defaultParams: {
    tipoOrden: 0,
    hasFilters: false,
    per_page: 18
  }
};

const { error } = apiConfigSchema.validate(apiConfig);
if (error) {
  throw new Error(`API config validation error: ${error.message}`);
}

module.exports = apiConfig;