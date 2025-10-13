// utils/httpClient.js
const axios = require('axios');
const logger = require('../../utils/logger.js');

class HttpClient {
    constructor(baseURL, timeout = 30000, retries = 3) {
        this.client = axios.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'PropertyAPI/1.0.0'
            }
        });

        this.retries = retries;
        this.setupInterceptors();
    }

    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                logger.debug(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('Request error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                logger.debug(`Received response with status ${response.status}`);
                return response;
            },
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status >= 500 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    for (let i = 0; i < this.retries; i++) {
                        try {
                            logger.warn(`Retrying request (${i + 1}/${this.retries})`);
                            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                            return this.client(originalRequest);
                        } catch (retryError) {
                            if (i === this.retries - 1) {
                                logger.error('All retry attempts failed');
                                break;
                            }
                        }
                    }
                }

                logger.error('Response error:', {
                    status: error.response?.status,
                    message: error.message,
                    url: originalRequest?.url
                });

                return Promise.reject(error);
            }
        );
    }

    async get(url, params = {}) {
        try {
            const response = await this.client.get(url, { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const apiError = new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
            apiError.status = error.response.status;
            apiError.data = error.response.data;
            throw apiError;
        } else if (error.request) {
            // Request made but no response received
            throw new Error(`Network Error: No response received - ${error.message}`);
        } else {
            // Something else happened
            throw new Error(`Request Error: ${error.message}`);
        }
    }
}

module.exports = HttpClient;