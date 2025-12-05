const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const seed = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3001;

// Ejecutar seed al iniciar
seed().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/event-data', require('./routes/eventData'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Respect Intern API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

