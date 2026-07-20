import express from "express";
import cors from "cors";
import wardrobeRoutes from "./routes/wardrobes.js";
import clothesRoutes from "./routes/clothes.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// Routes - static before dynamic
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/wardrobes', wardrobeRoutes);
app.use('/api/v1/clothes', clothesRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
