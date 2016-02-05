    'use strict';
           google.load("visualization", "1", {packages:["corechart"]});
        function StockController($scope) {
        let socket = io.connect();
        
        $scope.stocks = [];
        $scope.priceData = [];
        $scope.text = '';
        $scope.actionMsg = null;
        $scope.startDate = "2015-01-01";
        var apiKey;
        var currentDate = new Date();
            var dd = currentDate.getDate();
            var mm = currentDate.getMonth()+1;
            var yyyy = currentDate.getFullYear();
            if(dd<10) {
                dd='0'+dd;
            } 
            if(mm<10) {
                mm='0'+mm;
            } 
            $scope.endDate = yyyy+'-'+mm+'-'+dd;
        let baseAPIstart = "https://www.quandl.com/api/v3/datasets/WIKI/";
              socket.on('connect', function () {
                  console.log("Client connect");
        });
        
        socket.on("newStockSuccess", function(data){
              console.log("Client newStock");
                 $scope.actionMsg = "Stock successfully added!";
          if($scope.stocks.indexOf(data.stock) == -1){
              let x = $scope.stocks.length;
            $scope.stocks[x] = data.stock;
             $scope.$apply();
            $scope.renderStocks();
          }
        });
        
        socket.on('stock', function (stock) {
          if($scope.stocks.indexOf(stock) == -1){
            $scope.stocks[$scope.stocks.length] = stock;  
          }
          $scope.$apply();
        });
        
        socket.on('renderChart', function(quandlKey){
             console.log("Client renderChart");
          $scope.renderStocks(quandlKey);
        });
        
        socket.on('stockDeleteSuccess', function (data) {
          $scope.actionMsg = data.msg;
          $scope.$apply(); 
          if($scope.stocks.indexOf(data.stock) > -1){
              console.log("Client stockDeleteSuccess");
             console.log("datamsg " + data.msg);
        $scope.stocks.splice($scope.stocks.indexOf(data.stock), 1);
         $scope.$apply();
       $scope.renderStocks();
          }
        }
        );
        
        $scope.send = function send() {
            console.log("Client Send");
            $scope.text = $scope.text.replace(new RegExp(/(;)|(\')|(\")/g), "");
          socket.emit('newStock', $scope.text);
          $scope.text = '';
        };
        
        $scope.deleteStock = function deleteStock(stock){
            console.log("Client DeleteStock");
          socket.emit('stockDelete', {"stock": stock, "msg": "\"" + stock + "\" was successfully deleted from the chart."});
        }
        
        $scope.renderStocks = function renderStocks(quandlKey){
            if(quandlKey){
                apiKey = quandlKey
            }
           let cleanData = [];
           let stocksTraversed = 0;
           getData();
           
           function getData(){
               for(let stockNum = 0; stockNum < $scope.stocks.length; stockNum++){
                let theStock = $scope.stocks[stockNum];
                     $.ajax({
              
              url: baseAPIstart + theStock + 
                "/data.json?start_date=" + $scope.startDate + "&end_date=" + $scope.endDate +
                "&column_index=4&exclude_column_names=true&order=asc&api_key=" + apiKey,
              method: "GET",
              success: function(doc, textStatus, xhr) {
                 // console.log(xhr.status);
                let stockDatums = doc.dataset_data.data;
            if(cleanData.length == 0) { //First time through, with no dates yet in the dataset. Push date and price.
               for(let dataPoint = 0; dataPoint < stockDatums.length; dataPoint++) {
                  cleanData[dataPoint] = [new Date(stockDatums[dataPoint][0])];
                  cleanData[dataPoint][stockNum+1] = stockDatums[dataPoint][1];
                  if(dataPoint >= stockDatums.length - 1){
                    if(stocksTraversed < $scope.stocks.length-1){
                        stocksTraversed++;
                    }
                    else{
                      drawChart();   
                    }
            }
               }
            } else { //subsequent times through, where the date may overlap. Only push the price.
               for(let dataPoint = 0; dataPoint < stockDatums.length; dataPoint++){
                   let date = new Date(stockDatums[dataPoint][0]).getTime();
                   let dateIndex;
                   for(let k = 0; k < cleanData.length; k++){
                       if(cleanData[k][0].getTime() == date){
                           dateIndex = k;
                       }
                   }
                  if(dateIndex) {
                     cleanData[dateIndex][stockNum+1] = stockDatums[dataPoint][1];
                                       if(dataPoint >= stockDatums.length - 1){
                    if(stocksTraversed < $scope.stocks.length-1){
                        stocksTraversed++;
                    }
                    else{
                      drawChart();   
                    }
            }
                  }
                  else{ //new dates on subsequent iterations
                        let endIndex = cleanData.length;
                        cleanData[endIndex] = [new Date(stockDatums[dataPoint][0])];
                        cleanData[endIndex][stockNum+1] = stockDatums[dataPoint][stockNum+1];
                    if(dataPoint >= stockDatums.length - 1){
                    if(stocksTraversed < $scope.stocks.length-1){
                        stocksTraversed++;
                    }
                    else{
                      drawChart();   
                    }
            }
                  }
               }
            }
         }, error: function (request, textStatus, error) { 
            for(let dataPoint = 0; dataPoint < cleanData.length; dataPoint++){
                console.log("ERROR: " + error);
               cleanData[dataPoint][stockNum+1] = null;
                if(dataPoint >= cleanData.length - 1){
                    if(stocksTraversed < $scope.stocks.length-1){
                        stocksTraversed++;
                    }
                    else{
                      drawChart();   
                    }
            }
            }
         }});
           }
           }
           
        function drawChart(){
            var data = new google.visualization.DataTable();
            data.addColumn("date", 'Date');
           for(let i = 0; i < $scope.stocks.length; i++){
             data.addColumn("number", $scope.stocks[i]);
             if(i == $scope.stocks.length - 1){
               for(let j = 0; j < cleanData.length; j++){
                 if(cleanData[j].length -1 == $scope.stocks.length){
                        data.addRow(cleanData[j]); 
                 }
                 if(j == cleanData.length-1){
                   finishDrawing(data);
                 }
               }
             }
        }
      }
      function finishDrawing(data){
                     var options = {'title':"Stock Prices Over Time",
                       'width':1000,
                       'height':500,
                       'colors':['blue', 'green', 'purple', 'orange', 'black', 'red', 'gray'],
                        'interpolateNulls': true,
                         'vAxis': {
                      'viewWindow': {
                        'min':0
                      }
                     },
                     'crosshair': { trigger: 'focus' }, 
                     'hAxis':{
                      'format': 'M/d/yy',
                     }
                      };
          var chart = new google.visualization.LineChart(document.getElementById('stockChart'));
        chart.draw(data, options); 
      }
        }
          }