import express from 'express';
import identifyRoutes from './routes/identifyRoutes';

const app = express();
app.use(express.json()); // Middleware to parse incoming JSON payloads

app.use('/identify', identifyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});