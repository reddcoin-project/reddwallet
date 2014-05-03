'use strict';

var App = angular.module('app', ['ngCookies', 'ngResource', 'ngRoute', 'ngAnimate', 'app.wallet', 'app.global', 'app.directives', 'app.filters', 'app.services', 'partials']);
App.Wallet = angular.module('app.wallet', []);
App.Global = angular.module('app.global', []);

App.config([
    '$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider, config) {
        $routeProvider
            .when('/dashboard', { controller: 'DashboardCtrl', templateUrl: '/partials/dashboard.html'})
            .when('/send', { controller: 'SendCtrl', templateUrl: '/partials/send.html' })
            .when('/receive', { controller: 'ReceiveCtrl', templateUrl: '/partials/receive.html' })
            .when('/transactions', { controller: 'TransactionsCtrl', templateUrl: '/partials/transactions.html' })
            .when('/addresses', { controller: 'AddressesCtrl', templateUrl: '/partials/addresses.html' })

            .when('/initialize', { controller: 'InitializeCtrl', templateUrl: '/partials/initialize.html' })
            .otherwise({ redirectTo: '/dashboard' });

        return $locationProvider.html5Mode(false);
    }
]);

App.run(['$rootScope', '$route', '$location', 'daemonManager', function ($rootScope, $route, $location, daemonManager) {

    var handler = daemonManager.getHandler();

    $rootScope.$on("$routeChangeStart", function (event, next) {
        if (next != undefined && next.$$route != undefined) {

            if (!handler.isRunning() && !handler.isInitialized()) {
                $location.path('/initialize');
            }

        }
    });

}]);