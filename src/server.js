const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.resolve(`${__dirname}/../client/index.html`));
});

const server = http.createServer(app);

const ENUMS = {
  connections: 'connections',
};

// pass in the http server into socketio and grab the websocket server as io
const io = socketio(server);

server.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${port}`);
})

let globalDrawing = [];

const onConnect = (sock) => {
  const socket = sock;

  socket.emit('initDrawing', { drawSteps: globalDrawing });
  
  socket.join(ENUMS.connections);
};

const onUpdate = (sock) => {
  const socket = sock;
  
  socket.on('pathToServer', (data) => {
    globalDrawing.push(data);
    socket.broadcast.to(ENUMS.connections).emit('pathToClient', data);
  });
  
  socket.on('clearDrawing', () => {
    globalDrawing = [];
    io.to(ENUMS.connections).emit('clearDrawing');
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onConnect(socket);
  onUpdate(socket);
});

