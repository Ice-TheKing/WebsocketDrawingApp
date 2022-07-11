const express = require('express');
const expressHandlebars = require('express-handlebars');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const router = require('./router.js');
const id = require('./generateID.js');
const { create } = require('domain');

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
  defaultRoom: 'ROOM1'
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
drawings[ENUMS.defaultRoom] = [];
drawings['ROOM2'] = [];

const onConnect = (sock) => {
  const socket = sock;

  joinRoom('', ENUMS.defaultRoom, socket);
};

const joinRoom = (oldRoom, newRoom, socket) => {
  if (oldRoom === newRoom) {
    return;
  }

  if (!drawings[newRoom]) {
    socket.emit('invalidRoom', { error: 'Room does not exist.' });
    return;
  }

  socket.leave(oldRoom);
  socket.join(newRoom);
  socket.emit('clearDrawing');
  socket.emit('initDrawing', { drawSteps: drawings[newRoom], newRoom: newRoom });
};

const createRoom = (data, socket) => {
  let newID = id.getID();

  console.log(newID);

  drawings[newID] = [];

  joinRoom(data.oldRoom, newID, socket);
};

/// handles events from client
const onUpdate = (sock) => {
  const socket = sock;

  /**
   * TODO: separate these as separate functions and call them from here, e.g.
   *  socket.on('joinRoom', (data) => joinRoom(data));
   * */ 

  socket.on('createRoom', (data) => createRoom(data, socket));
  
  socket.on('joinRoom', (data) => joinRoom(data.oldRoom.toUpperCase(), data.newRoom.toUpperCase(), socket) );

  socket.on('pathToServer', (data) => {
    const room = data.room.toUpperCase();
    const path = data.path;

    if (!drawings[room]) {
      console.log(room);
      return;
    }

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
  onConnect(socket);
  onUpdate(socket);
});