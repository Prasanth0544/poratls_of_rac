/**
 * swagger.js
 * Swagger/OpenAPI documentation configuration
 * Run with: npm run dev or curl http://localhost:3000/api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RAC Reallocation System API',
      version: '1.0.0',
      description: 'Railway Reservation & Allotment Code (RAC) Reallocation System API Documentation',
      contact: {
        name: 'RAC System Support',
        email: 'support@rac-system.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3001',
        description: 'TTE Portal'
      },
      {
        url: 'http://localhost:3002',
        description: 'Admin Portal'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        Passenger: {
          type: 'object',
          properties: {
            pnr: { type: 'string', example: 'RAC123456' },
            name: { type: 'string', example: 'John Doe' },
            age: { type: 'number', example: 30 },
            gender: { type: 'string', enum: ['M', 'F', 'O'] },
            pnrStatus: { type: 'string', enum: ['RAC', 'CNF', 'WL', 'CAN'] },
            from: { type: 'string', example: 'PUNE' },
            to: { type: 'string', example: 'DELHI' },
            coach: { type: 'string', example: 'C1' },
            berth: { type: 'string', example: '24' },
            boarded: { type: 'boolean' }
          }
        },
        Berth: {
          type: 'object',
          properties: {
            coach: { type: 'string', example: 'C1' },
            berthNo: { type: 'string', example: '24' },
            type: { type: 'string', enum: ['Lower', 'Upper', 'Middle', 'Side Lower', 'Side Upper'] },
            class: { type: 'string', enum: ['AC 1', 'AC 2', 'AC 3', 'SL', 'GN'] },
            occupancy: { type: 'string', example: '75%' },
            status: { type: 'string', enum: ['Occupied', 'Vacant', 'Partial'] }
          }
        },
        UpgradeOffer: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'OFFER-2025-001' },
            pnr: { type: 'string', example: 'RAC123456' },
            name: { type: 'string', example: 'John Doe' },
            offeredBerth: { type: 'string', example: 'C2-25' },
            offeredClass: { type: 'string', example: 'AC 2' },
            status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'] },
            createdAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Configuration',
        description: 'System configuration endpoints'
      },
      {
        name: 'Passengers',
        description: 'Passenger management and search'
      },
      {
        name: 'RAC Queue',
        description: 'RAC queue operations'
      },
      {
        name: 'Reallocation',
        description: 'Reallocation and upgrade operations'
      },
      {
        name: 'Visualization',
        description: 'Train visualization and monitoring'
      }
    ]
  },
  apis: ['./routes/api.js'] // Path to your route files
};

const specs = swaggerJsdoc(options);
module.exports = specs;
