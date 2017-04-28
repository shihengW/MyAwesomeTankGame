// Guide: https://expressjs.com/en/starter/hello-world.html
var express = require('express');  
var app = express();  

//Static resources server
app.use(express.static("../"));

var server = app.listen(8082, function () {  
    var port = server.address().port;
    console.log('Server running at port %s', port);});
