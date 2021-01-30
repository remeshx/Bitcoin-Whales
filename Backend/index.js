const {_PORT_ADDRESS} = require('./config/server');
const express = require('express');
const cors = require('cors');
const http = require("http");
const socketIo = require("socket.io");

const ApiRouter = require('./app/router/web');

const app = express();
global.settings =[];

global.newvar = 'Hello';
app.use(cors({origin: '*'}));
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





const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: '*',
    }
  });
let interval;

io.on("connection", (socket) => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

const getApiAndEmit = socket => {
    const response = new Date();
    // Emitting a new message. Will be consumed by the client
    socket.emit("FromAPI", {time: response});
    console.log('sendResponse',response);
  };

const port = process.env.PORT || 3231;
server.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;