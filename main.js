var app = angular.module('app', ['ui.bootstrap', 'ngCookies']);

app.
  component('forecast', {
    template: 
      '<main class="{{query.condition.text}}">' +
        '<h1>{{query.title}}</h1>' +
        '<h2>{{query.condition.text}}</h2>' +
        '<h2>{{query.condition.temp}}&deg;</h2>' +
        '<form ng-submit="submit()">' +
          '<input type="number" ng-model="zip" class="form-control">' +
          '<button class="btn btn-primary">Go!</button>' +
        '</form>' +
      '</main>' +
      '<div class="container">' + 
        '<div class="btns">' +
          '<div class="btn-group">' +
            '<label class="btn btn-primary" ng-model="radioModel" uib-btn-radio="\'dashboardactive\'">Dashboard</label>' +
            '<label class="btn btn-primary" ng-model="radioModel" uib-btn-radio="\'thisweekactive\'">This Week</label>'+
          '</div>' +
        '</div>' +
        '<div id="dashboard" class="row {{radioModel}}">'+
          '<div class="col-md-2 col-sm-4" ng-repeat="item in items">' +
            '<div class="card">' +
              '<h2>{{item[0]}}</h2>'+
              '<h3>{{item[1].condition.text}}</h3>' +
              '<h3 class="temps">{{item[1].condition.temp}}&deg;</h3>' +
              '<button class="btn-primary btn btn-block" ng-click="do(item[0])">Forcast</button>' +
              '<button class="btn-danger btn btn-block" ng-click="removeZip(item[0])">Remove</button>' +
            '</div>' +
          '</div>' +
        '</div>'+
        '<div id="thisweek" class="row {{radioModel}}">'+
          '<div class="col-md-2 col-sm-4" ng-repeat="day in days">' +
            '<div class="card">' +
              '<h2>{{day.date}}</h2>' +
              '<h3>{{day.text}}</h3>' +
              '<h3 class="temps">{{day.high}}&deg; <span>{{day.low}}&deg;</span></h3>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<a style="float: right; margin-top: 15px;" href="https://www.yahoo.com/?ilc=401" target="_blank"> <img src="https://poweredby.yahoo.com/purple.png" width="134" height="29"/> </a>' +
      '</div>' , 
    controller: function forecastData($scope, $http, $cookies, $q) {

      $scope.do = function(num) {
        $scope.zip = parseInt(num);
        $scope.go();
        $scope.radioModel = "thisweekactive";
      }

      $scope.go = function() {
        $http.get('https://query.yahooapis.com/v1/public/yql?q=select%20item%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text=%27'
          + $scope.zip +
          '%27)&format=json')
          .then(function(response){
            if(response.data.query.count != 0){
              $scope.query = response.data.query.results.channel.item;
              $scope.days = response.data.query.results.channel.item.forecast;
              $scope.days = $scope.days.slice(0,6);
            } else {
              alert("Uh oh, Yahoo! has no data for that zip code.");
              $scope.zip = 10001;
              $scope.go(10001);
            }
          });
      }

      $scope.saveZip = function(){
        if(!$cookies.get('zips').includes($scope.zip)) {
          $http.get('https://query.yahooapis.com/v1/public/yql?q=select%20item%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text=%27'
          + $scope.zip +
          '%27)&format=json')
            .then(function(response){
              if(response.data.query.count != 0){
                $cookies.put('zips', $cookies.get('zips') + $scope.zip+',');
                $scope.items.push([$scope.zip, response.data.query.results.channel.item]);
              }
            });
        }
      }

      $scope.submit = function() {
        $scope.go();
        $scope.saveZip();
      }

      $scope.removeZip = function(num) {
        $cookies.put('zips', $cookies.get('zips').replace(num + ',', ''));
        for (var i = 0; i < $scope.items.length; i++){
          if($scope.items[i][0] == num)
            $scope.items.splice(i, 1);
        }
      }


      $scope.radioModel = 'thisweekactive';

      $scope.items = [];
      $scope.zip = 10001;

      // Init dashboard
      if($cookies.get('zips') == null){
        $cookies.put('zips', $scope.zip+',');
        $http.get('https://query.yahooapis.com/v1/public/yql?q=select%20item%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text=%27'
          + 10001 +
          '%27)&format=json')
          .then(function(response){
            $scope.items.push([10001, response.data.query.results.channel.item]);
          });
      } else {
        // Iterate through the cookies and set up the dashboard
        var cooks=$cookies.get('zips').split(',');
        var promises = [];
        for(var i = 0; i < cooks.length; i++){
          if(cooks[i] != ''){
            var promise = $http.get('https://query.yahooapis.com/v1/public/yql?q=select%20item%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text=%27'
              + parseInt(cooks[i]) +
              '%27)&format=json');
            promises.push(promise);
          }
        }
        $q.all(promises).then(function(response){
          for(var j = 0; j < promises.length; j++) {
            $scope.items.push([cooks[j], response[j].data.query.results.channel.item]);
          }
        });
      }

      $scope.go();

      window.navigator.geolocation.getCurrentPosition(function(pos){
        $http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+pos.coords.latitude+','+pos.coords.longitude+'&sensor=true').then(function(res){
          $scope.zip = parseInt(res.data.results[0].address_components[7].short_name);
          $scope.go();
        });
      });
    }
  })
;

/*
angular.
  module('app').
  component('zipForm', {
    template:
      '<form ng-submit="go()">' +
      '<input type="number" ng-model="zip" maxlength="5">' +
      '<button>Go!</button>' +
      '</form>'
      , 
    controller: function formFuction($scope, $http){
      $scope.go = function() {
        //console.log($scope.query.title);
        changelocation($scope, $http, $scope.zip);
      }
    }
  })
;
function changelocation(scope, http, zip){
  //var zip = parseInt(window.location.href.substr(window.location.href.indexOf("#") + 1));
  //window.location.href("#{{zip}}");
  console.log(zip);
  http.get('https://query.yahooapis.com/v1/public/yql?q=select%20item%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text=%27'
        + zip +
        '%27)&format=json')
        .then(function(response){
          scope.query = response.data.query.results.channel.item;
          scope.days = response.data.query.results.channel.item.forecast;
          console.log(scope.query.title);
        });
}
*/