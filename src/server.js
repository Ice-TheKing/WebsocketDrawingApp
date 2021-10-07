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

app.use('/bootstrap', express.static(path.resolve(`${__dirname}/../node_modules/bootstrap/dist/`)));
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

