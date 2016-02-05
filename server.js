 'use strict';
var http = require('http');
var path = require('path');

require('dotenv').config();
var request = require("request");
var async = require('async');
var socketio = require('socket.io');
var express = require('express');
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
     console.log("Server connection: " + process.env.QUANDL_KEY);
    Stock.find({}, function(err, doc){
        for(let i = 0; i < doc.length; i++){
            socket.emit("stock", doc[i].symbol);
            if(i == doc.length-1){
              socket.emit("renderChart", process.env.QUANDL_KEY);
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
      var stock = String(stk.toUpperCase() || '');
    
      if (!stock.length){
       return; 
      }
                      request({
                url: "https://www.quandl.com/api/v3/datasets/WIKI/" + stock + 
                "/data.json?start_date=2016-01-01&end_date=2016-01-01&column_index=4&exclude_column_names=true&order=asc&api_key=" + process.env.QUANDL_KEY,
                method: "HEAD"}, //request params
                function(error, response, body){
                    if(error){
                         console.log("Error: " + error);
                    }
                    else{
                        if(response.statusCode != 404){
                             var newStock = new Stock({"symbol": stock});
                        newStock.save(function(err, msg){
                        if(msg && !err){
                        //broadcast('stock', stock);
                     broadcast("newStockSuccess", {"stock": stock, "quandlKey": process.env.QUANDL_KEY});
                     }
                    });
                        }
                        else{
                            console.log("404ing!");
                         socket.emit("stockDeleteSuccess", {"stock": stock, "quandlKey": process.env.QUANDL_KEY,
                         "msg": "\"" + stock + "\" was unsuccessfully added to the chart. Try a different stock symbol."});
                        }
                }
                });
      
    }); //socket on new stock
    
      socket.on('stockDelete', function (data) {
           console.log("Server stockDelete");
    var stock = String(data.stock || '');
      if (!stock){
       return; 
      }
      Stock.remove({"symbol": stock}, function(err, msg){
        if(msg && !err){
         broadcast('stockDeleteSuccess', {"stock": stock, "quandlKey": process.env.QUANDL_KEY, "msg": data.msg});
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