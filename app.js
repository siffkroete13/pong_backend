const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const morgan = require('morgan');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(morgan('dev'));

app.use((req, res, next) => {
    const err = new Error('Nicht gefunden!');
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
        data: '',
        error: err.message
    });
});

module.exports = app;
