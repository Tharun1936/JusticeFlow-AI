import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import caseRoutes from './routes/case.routes.js';
import predictionRoutes from './routes/prediction.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/cases', caseRoutes);
app.use('/predictions', predictionRoutes);
app.use('/admin', adminRoutes);

// Error handler
app.use(errorMiddleware);

export default app;
