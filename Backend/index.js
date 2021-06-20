const {_PORT_ADDRESS} = require('./config/server');
const express = require('express');
const cors = require('cors');
const http = require("http");
const PRELOADING = require('./app/Controllers/preloading');
const Whales = require('./app/Controllers/whales');
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

app.use(errorHandler({ dumpExceptions: true, showStack: true })); 
app.use(cors({origin: '*'}));
app.use(function(req, res, next){
    res.io = io;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   
    next();
  });
app.use('/api', ApiRouter);


const SettingModel = require('./app/Models/settings');
const { exit } = require('process');
SettingModel.loadSetting('BitcoinNode')
.then(()=>{
    let action = global.settings['BitcoinNode_CurrentStage'];
    console.log('action:',action);
   
    switch (action) {
      case '1': 
              console.log('Start App : ', 'preloading_stage1_getblockinfo');
              PRELOADING.preloading_stage1_getblockinfo(io);
              break;
      case '2': 
              console.log('Start App : ', 'preloading_stage2_ImportFilesToDB');
              PRELOADING.preloading_stage2_ImportFilesToDB(io);
              break;
      case '3': 
              console.log('Start App : ', 'preloading_stage3_ExtractAddresses');
              PRELOADING.preloading_stage3_ExtractAddresses(io);
              break;        
      case '4': 
              console.log('Start App : ', 'preloading_stage4_ImportAddressesToDB');
              PRELOADING.preloading_stage4_ImportAddressesToDB(io);
              break;        
      case '5': 
              console.log('Start App : ', 'preloading_stage5_FindingWhales');
              PRELOADING.preloading_stage5_FindingWhales(io);
              break;        
      case '6': 
              console.log('Start App : ', 'startup');
              Whales.startup(io);
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