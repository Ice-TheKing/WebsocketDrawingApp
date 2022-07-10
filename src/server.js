const express = require('express');
const expressHandlebars = require('express-handlebars');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const router = require('./router.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = express();

app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`)));
app.use('/react', express.static(path.resolve(`${__dirname}/../node_modules/react/umd/`)));
app.use('/reactDOM', express.static(path.resolve(`${__dirname}/../node_modules/react-dom/umd/`)));
app.use('/modules', express.static(path.resolve(`${__dirname}/../node_modules/`)));

app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');

router(app, path);

const server = http.createServer(app);

const ENUMS = {
  connections: 'connections',
  room1: 'room1',
  room2: 'room2'
};

// pass in the http server into socketio and grab the websocket server as io
const io = socketio(server);

server.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${port}`);
})

// todo: dynamically create these
let drawings = {};
drawings['room1'] = [];
drawings['room2'] = [];

const onConnect = (sock) => {
  const socket = sock;

  // console.dir(sock.handshake.query.room);

  socket.emit('initDrawing', { drawSteps: drawings['room1'] });
  
  socket.join(ENUMS.room1);
};

const onUpdate = (sock) => {
  const socket = sock;
  
  socket.on('joinRoom', (data) => {
    if (data.oldRoom === data.newRoom) {
      return;
    }

    socket.leave(data.oldRoom);
    socket.join(data.newRoom);
    socket.emit('clearDrawing');
    socket.emit('initDrawing', { drawSteps: drawings[data.newRoom] });
  });

  socket.on('pathToServer', (data) => {
    // console.dir(data);
    const room = data.room;
    const path = data.path;

    drawings[room].push(path);
    socket.broadcast.to(room).emit('pathToClient', path);
  });
  
  socket.on('clearDrawing', (data) => {
    const room = data.room;

    drawings[room] = [];

    io.to(room).emit('clearDrawing');
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onConnect(socket);
  onUpdate(socket);
});

