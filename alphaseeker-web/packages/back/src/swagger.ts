import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AlphaSeeker API',
            version: '1.0.0',
            description: 'API for AlphaSeeker Financial News & Investment Advice',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Local server',
            },
        ],
    },
    apis: ['./src/api/routes/*.ts', './src/api/controllers/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
