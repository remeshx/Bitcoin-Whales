const {_PORT_ADDRESS} = require('./config/server');
const express = require('express');
const cors = require('cors');
const http = require("http");
const socketIo = require("socket.io");

const ApiRouter = require('./app/router/web');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: '*',
    }
  });


global.settings =[];

global.newvar = 'Hello';
app.use(cors({origin: '*'}));
app.use(function(req, res, next){
    res.io = io;
    next();
  });
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






let interval;

io.on("connection", (socket) => {
  console.log("New client connected");
  
  socket.on("disconnect", () => {
    console.log("Client disconnected");
   
  });
});


const port = process.env.PORT || 7321;
server.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;