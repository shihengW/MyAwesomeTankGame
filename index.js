// Dependencies:
// Express- https://expressjs.com/en/starter/hello-world.html
// SocetIO - https://socket.io/get-started/chat/
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname));

io.on('connection', function(socket) {
  var id;

  // When anything updated.
  socket.on("tankUpdate", function(client) {
    id = client.tankId;
    socket.broadcast.emit("tankUpdateGlobal", client);
  });

  // When client disconnected.
  socket.on('disconnect', function () {
    socket.broadcast.emit("disconnectGlobal", { tankId: id });
  });
});

http.listen(3000, function(){
  console.log('listening on *: 3000');
});