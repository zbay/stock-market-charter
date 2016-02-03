
 'use strict';
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var dotenv = require('dotenv');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var Stock = require("./dbmodels/stock.js");
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
var sockets = [];

io.on('connection', function (socket) {
     console.log("Server connection");
    Stock.find({}, function(err, doc){
        for(let i = 0; i < doc.length; i++){
            socket.emit("stock", doc[i].symbol);
            if(i == doc.length-1){
              socket.emit("renderChart", null);
            }
          }
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
         console.log("Server disconnect");
      sockets.splice(sockets.indexOf(socket), 1);
    });

    socket.on('newStock', function (stk) {
         console.log("Server newStock: " + stk);
      var stock = String(stk || '');
    
      if (!stock.length){
       return; 
      }
    //Add validation of stock symbol?
            var newStock = new Stock({"symbol": stock});
          newStock.save(function(err, msg){
        if(msg && !err){
          //broadcast('stock', stock);
          broadcast("newStockSuccess", stock);
        }
      });
      
    }); //socket on stock
    
      socket.on('stockDelete', function (stk) {
           console.log("Server stockDelete");
    var stock = String(stk || '');
      if (!stock){
       return; 
      }
      Stock.remove({"symbol": stock}, function(err, msg){
        if(msg && !err){
         broadcast('stockDeleteSuccess', stock);
        }
      });
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