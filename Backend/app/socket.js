const http = require("http");
const socketIo = require("socket.io");

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

