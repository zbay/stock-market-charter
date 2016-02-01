      function StockController($scope) {
        var socket = io.connect();
        
        $scope.stocks = [];
       // $scope.pric
        $scope.text = '';
        $scope.errorMsg = null;
        $scope.startDate = Date.parse("2015-01-01");
        $scope.endDate = Date.parse("2016-01-29");
        $scope.priceData = [];
        var baseAPIstart = "https://www.quandl.com/api/v3/datasets/WIKI/";
        var baseAPIend = "/data.json?column_index=4&exclude_column_names=true&order=asc&api_key=";
        var APIkey = "FA9U87SHeUggkweQ-hdU"

        socket.on('connect', function () {
         $scope.renderStocks();
        });

        socket.on('stock', function (stock) {
          $scope.errorMsg = null;
          $scope.stocks.push(stock); 
          $scope.$apply();
        });
        
        socket.on('renderChart', function(){
          $scope.renderStocks();
        });
        
        socket.on('stockDelete', function (stock) {
          
          if($scope.stocks.indexOf(stock) > -1){
             $scope.errorMsg = null;
                      
        $scope.stocks.splice($scope.stocks.indexOf(stock), 1);
              $scope.$apply(); 
          }
          else{
            $scope.errorMsg = "That stock symbol is either invalid or redundant. Try again!";
          }
        });

        $scope.send = function send() {
          socket.emit('stock', $scope.text);
          $scope.text = '';
        };
        
        $scope.deleteStock = function deleteStock(stock){
          socket.emit('stockDelete', stock);
        }
        
        $scope.renderStocks = function renderStocks(){
            var stockData = [];
           // google.load('visualization', '1.0', {'packages':['line']});
            //google.setOnLoadCallback($scope.drawChart);
            $scope.getData($scope.drawChart());
            
        }
        
        $scope.getData = function getData(callback){   
          for(var i = 0; i < $scope.stocks.length; i++){
            var theStock = $scope.stocks[i];
            $.ajax({
              method: "GET",
              url: baseAPIstart + theStock + baseAPIend + APIkey,
              success: function(doc){
                console.log(doc);
                $scope.priceData.push(doc.data);
              }
            });
            
          callback();
          }
        }
        
        $scope.drawChart = function drawChart(){
          console.log("drawing chart?");
            var data = new google.visualization.DataTable();
            data.addColumn("date", "Date");
           for(var i = 0; i < $scope.stocks.length; i++){
             data.addColumn("number", $scope.stocks[i]);
        }
        var localData = $scope.priceData.filter(function(datum){
          return Date.parse(datum[0]) >= $scope.startDate && Date.parse(datum) <= $scope.endDate;
        });
        for(var i = 0; i < localData.length; i++){
          var rowTemp = [];
          for(var j = 0; j < $scope.stocks.length; j++){
            rowTemp.push(localData[j][i]);
          }
          data.addRow(rowTemp);
        }
        var options = {'title':"Stock Prices Over Time",
                       'width':1000,
                       'height':500,
                       'colors':["green", "red", 'blue', "orange", "purple", "black", "gray", "pink", "brown"],
                       'vAxis': {'viewWindow': {'min':0.0}}};
        var chart = new google.visualization.LineChart(document.getElementById('stockChart'));
        chart.draw(data, options);
      }
      }