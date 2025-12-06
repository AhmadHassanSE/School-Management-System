const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const Routes = require("./routes/route.js")

// Load environment variables
dotenv.config();

const app = express()
const PORT = process.env.PORT || 3000;

// Debug info
console.log("=== SERVER STARTING ===");
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(cors())

// ====== REQUIRED ENDPOINTS ======
// Health check (Railway requires this)
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'School Management API',
        endpoints: {
            health: '/api/health',
            api: '/api/*'
        }
    });
});
// ================================

// Database connection
mongoose
    .connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
    })
    .then(() => {
        console.log("✅ Connected to MongoDB");
        
        // Start server AFTER DB connection
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
            console.log(`✅ Health check available at http://0.0.0.0:${PORT}/api/health`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1);
    });

// Your routes
app.use('/', Routes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Export app
module.exports = app;
