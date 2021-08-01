const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

const ENUMS = {
  connections: 'connections',
};

console.log(`Listening on port ${port}`);

// pass in the http server into socketio and grab the websocket server as io
const io = socketio(app);

let globalNum = 0;
let globalDrawing = [];

const onConnect = (sock) => {
  const socket = sock;

  socket.emit('updateNum', { num: globalNum });
  socket.emit('initDrawing', { drawSteps: globalDrawing });
  
  socket.join(ENUMS.connections);
};

const onUpdate = (sock) => {
  const socket = sock;
  
  socket.on('pathToServer', (data) => {
    globalDrawing.push(data);
    socket.broadcast.to(ENUMS.connections).emit('pathToClient', data);
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onConnect(socket);
  onUpdate(socket);
});

