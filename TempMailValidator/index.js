import express  from 'express';
import { isDisposableEmail } from './utils/emailValidator.js';
import { ENV } from './config/env.js';
import { arcjetMiddleware } from './middleware/arcjet.middleware.js';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from "cors";

const app = express();
const PORT = ENV.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(arcjetMiddleware);
app.set('trust proxy', 1);
app.use(hpp());
app.use(helmet());
app.use(cors());

// API endpoint to check if email is temporary
app.get('/check', (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                error: 'Email parameter is required',
                tempmail: null
            });
        }

        // Validate email format (basic check)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                tempmail: null
            });
        }

        const isTempMail = isDisposableEmail(email);

        res.json({
            tempmail: isTempMail
        });

    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({
            error: 'Internal server error',
            tempmail: null
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'TempMail Validator API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`TempMail Validator API listening on port ${PORT}`);
});