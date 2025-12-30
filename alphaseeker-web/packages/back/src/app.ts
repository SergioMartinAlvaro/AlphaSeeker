import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import * as fs from 'fs';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (Explicitly load credentials for robustness)
if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

        if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin initialized with service account.');
        } else {
            console.warn('GOOGLE_APPLICATION_CREDENTIALS not set or file not found. Attempting default init (ADC)...');
            // CRITICAL FIX: If env var is set to a bad path, ADC matches it and crashes. Unset it.
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
            }
            admin.initializeApp();
        }
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

import newsRoutes from './api/routes/newsRoutes';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/uploads', express.static('uploads'));

app.use('/api/news', newsRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'AlphaSeeker Backend' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
