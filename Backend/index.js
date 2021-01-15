const {_PORT_ADDRESS} = require('./config/server');
const express = require('express');
const ApiRouter = require('./app/router/web');

const app = express();


app.use('/api', ApiRouter);

app.use((err,req, res, next)=>{
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        type:'error', message: err.message
    });
});

app.listen(_PORT_ADDRESS, () => {
    console.log(`App listening at http://localhost:${_PORT_ADDRESS}`)
  });

module.exports = app;