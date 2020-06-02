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

const onConnect = (sock) => {
  const socket = sock;

  socket.join(ENUMS.connections);

  socket.on('join', (data) => {
    socket.emit('updateNum', { num: globalNum });
  });
};

const onUpdateNum = (sock) => {
  const socket = sock;

  socket.on('updateServerNum', (data) => {
    console.dir(data);
    globalNum = data.newNum;
    
    // TODO: broadcast correctly to all connected sockets. Right now this ain't doing shit
    socket.broadcast.to(ENUMS.connections).emit('updateNum', { globalNum })
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onConnect(socket);
  onUpdateNum(socket);
});

