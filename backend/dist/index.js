"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const returnRoutes_1 = __importDefault(require("./routes/returnRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use((0, cors_1.default)({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Built-in body parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Serve local uploaded images statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/returns', returnRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});
// Fallback for unmatched routes (404)
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Listen
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
}
exports.default = app;
