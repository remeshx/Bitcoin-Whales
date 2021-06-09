const {_PORT_ADDRESS} = require('./config/server');
const express = require('express');
const cors = require('cors');
const http = require("http");
const fs = require('fs');
const Blockchain = require('./app/Controllers/api/blockChain');
const socketIo = require("socket.io");

const ApiRouter = require('./app/router/web');

const app = express();
var errorHandler = require('errorhandler')

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: '*',
    }
  });


global.settings =[];

global.newvar = 'Hello';

app.use(errorHandler({ dumpExceptions: true, showStack: true })); 
app.use(cors({origin: '*'}));
app.use(function(req, res, next){
    res.io = io;
    next();
  });
app.use('/api', ApiRouter);

const SettingModel = require('./app/Models/settings');
SettingModel.loadSetting('BlockChain','CurrentStage')
.then(()=>{
    let action = global.settings['BitcoinNode_CurrentStage'];
    console.log(action);
    switch (action) {
      case '1': 
              console.log('Start App : ', 'checkForNewblocks_new');
              Blockchain.checkForNewblocks_new();
              break;
      case '2': 
              console.log('Start App : ', 'updateSpentTransactions');
              //Blockchain.updateSpentTransactions();
              break;
    }
}).catch(error=>reject(error));








process.on('uncaughtException', (reason, p) => {
    console.error(reason, 'uncaught Exception at Promise', p);
  })
process.on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  });

  process.on('SIGTERM', signal => {
    console.log(`Process ${process.pid} received a SIGTERM signal`)
    process.exit(0)
  })
  
  process.on('SIGINT', signal => {
    console.log(`Process ${process.pid} has been interrupted`)
    process.exit(0)
  })

  app.use((err,req, res, next)=>{
    const statusCode = err.statusCode || 500;
    console.log('error XX: ' + err.message);
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


const port = process.env.PORT || 51332;
server.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;