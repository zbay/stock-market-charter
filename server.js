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
var request = require('request');
var baseAPIstart = "https://www.quandl.com/api/v3/datasets/WIKI/";
var baseAPIend = "/data.json?column_index=4&exclude_column_names=true&order=asc&api_key=";

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
    var stockStream = Stock.find().stream();
    stockStream.on("data", function(doc){
      stocks.push(doc.symbol);
      socket.emit("stock", doc.symbol);
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
      //console.log(baseAPIstart + stock + baseAPIend + process.env.QANDL_KEY);
      console.log(baseAPIstart + stock + baseAPIend + "FA9U87SHeUggkweQ-hdU");
      request({
        method:"GET",
       // url: baseAPIstart + stock + baseAPIend + process.env.QANDL_KEY
        url: baseAPIstart + stock + baseAPIend + "FA9U87SHeUggkweQ-hdU"
      },
      function(error, response, body){
        //closing price is: body.dataset_data.data
        if(body && !error){
          console.log(body);
            var newStock = new Stock({"symbol": stock, "priceData": body});
          newStock.save(function(err, msg){
        if(msg && !err){
          broadcast('stock', stock);
        stocks.push(stock); 
        }
        else{
          broadcast('deleteStock', stock);
        }
      });
        }
        else{
          alert(error);
        }
      });
      
    });
    
      socket.on('stockDelete', function (stk) {
    var stock = String(stk || '');
      if (!stock){
       return; 
      }
      Stock.remove({"symbol": stock}, function(err, msg){
        broadcast('stockDelete', stock);
        stocks.splice(stocks.indexOf(stock), 1);
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