var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var dotenv = require('dotenv');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var db = mongoose.connection;


mongoose.connect('mongodb://localhost:27017/stock-market-charter', function (err, db){
//mongoose.connect(process.env.MONGOLAB_URI, function (err, db)
//
 if (err) {
   console.log(err);
      throw new Error('Database failed to connect!');
   } else {
      console.log('Successfully connected to MongoDB.');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var stocks = [];
var sockets = [];

io.on('connection', function (socket) {
    stocks.forEach(function (data) {
      console.log("FOREACH: " + data);
      socket.emit('stock', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
    });

    socket.on('stock', function (stk) {
      var stock = String(stk || '');
    
      if (!stock.length){
       return; 
      }

        broadcast('stock', stock);
        stocks.push(stock);
    });

  });

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Stock server listening at", addr.address + ":" + addr.port);
});
}
});