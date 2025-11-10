const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth');
const meterRoutes = require('./src/routes/meter');
const forecastRoutes = require('./src/routes/forecast');
const billRoutes = require('./src/routes/bill');

const app = express();

//middlewares
app.use(cors)
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(morgan('dev'));

//route handlers
app.use('/api/routes', authRoutes);
app.use('/api/meter', meterRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/bills', billRoutes);

//404 handler
app.use((req, res) => {
    res.status(404).json({ error : 'route not found'})
})

//error handler
app.use((err, req, res, next) => {
    console.error(err.status);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    })
})

module.exports = app;