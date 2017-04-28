// Dependencies:
// Express- https://expressjs.com/en/starter/hello-world.html
// SocetIO - https://socket.io/get-started/chat/
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
  res.sendFile(__dirname + "/index.html")
})

io.on('connection', function(socket){
  console.log('a user connected');
});

app.use(express.static(__dirname));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})