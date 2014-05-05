'use strict';

var App = angular.module('app', [
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngAnimate',
    'mgcrea.ngStrap',
    'nwFileDialog',
    'app.wallet',
    'app.global',
    'app.daemon',
    'app.directives',
    'app.filters',
    'app.services',
    'partials'
]);

// Setting up namespaces for the applications
App.Wallet = angular.module('app.wallet', []);
App.Global = angular.module('app.global', []);
App.Daemon = angular.module('app.daemon', []);

App.config([
    '$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider, config) {
        $routeProvider
            .when('/dashboard', { controller: 'DashboardCtrl', templateUrl: '/partials/dashboard.html'})
            .when('/send', { controller: 'SendCtrl', templateUrl: '/partials/send.html' })
            .when('/receive', { controller: 'ReceiveCtrl', templateUrl: '/partials/receive.html' })
            .when('/transactions', { controller: 'TransactionsCtrl', templateUrl: '/partials/transactions.html' })
            .when('/addresses', { controller: 'AddressesCtrl', templateUrl: '/partials/addresses.html' })
            .when('/settings', { controller: 'SettingsCtrl', templateUrl: '/partials/settings.html' })

            .when('/initialize', { controller: 'InitializeCtrl', templateUrl: '/partials/initialize.html' })
            .otherwise({ redirectTo: '/dashboard' });

        return $locationProvider.html5Mode(false);
    }
]);

App.config(['$alertProvider', function($alertProvider) {
    angular.extend($alertProvider.defaults, {
        animation: 'am-fade',
        placement: 'bottom-right',
        duration: 5,
        container: '#alerts-container'
    });
}]);

App.run(['$rootScope', '$route', '$location', 'DaemonManager', function ($rootScope, $route, $location, DaemonManager) {

    $rootScope.$on("$routeChangeStart", function (event, next) {
        if (next != undefined && next.$$route != undefined) {

            if (!DaemonManager.isRunning()) {
                $location.path('/initialize');
            }

        }
    });

}]);