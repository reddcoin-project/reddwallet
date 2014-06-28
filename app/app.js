'use strict';

var App = angular.module('app', [
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngAnimate',
    'ngTable',
    'mgcrea.ngStrap',
    'nwFileDialog',
    'luegg.directives',
    'perfect_scrollbar',
    'app.wallet',
    'app.global',
    'app.daemon',
    'app.irc',
    'app.directives',
    'app.filters',
    'app.services',
    'partials'
]);

// Setting up namespaces for the applications
App.Wallet = angular.module('app.wallet', []);
App.Global = angular.module('app.global', []);
App.Daemon = angular.module('app.daemon', []);
App.Utils = angular.module('app.utils', []);
App.Irc = angular.module('app.irc', []);

App.config([
    '$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider, config) {
        $routeProvider
            .when('/initialize', { controller: 'InitializeCtrl', templateUrl: '/partials/initialize.html' })
            .when('/dashboard', { controller: 'DashboardCtrl', templateUrl: '/partials/dashboard.html'})
            .when('/news', { controller: 'NewsCtrl', templateUrl: '/partials/news.html'})
            .when('/announcement', { controller: 'AnnouncementCtrl', templateUrl: '/partials/announcement.html'})
            .when('/send', { controller: 'SendCtrl', templateUrl: '/partials/send.html' })
            .when('/receive', { controller: 'ReceiveCtrl', templateUrl: '/partials/receive.html' })
            .when('/transactions', { controller: 'TransactionsCtrl', templateUrl: '/partials/transactions.html' })
            .when('/addresses', { controller: 'AddressesCtrl', templateUrl: '/partials/addresses.html' })
            .when('/settings', { controller: 'SettingsCtrl', templateUrl: '/partials/settings.html' })
            .when('/help', { controller: 'HelpCtrl', templateUrl: '/partials/help.html' })

            .when('/irc', { controller: 'MainIrcCtrl', templateUrl: '/partials/irc-main.html' })

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

String.prototype.toTitleCase = function() {
    var i, j, str, lowers, uppers;
    str = this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });

    // Certain minor words should be left lowercase unless
    // they are the first or last words in the string
    lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At',
              'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
    for (i = 0, j = lowers.length; i < j; i++)
        str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'),
            function(txt) {
                return txt.toLowerCase();
            });

    // Certain words such as initialisms or acronyms should be left uppercase
    uppers = ['Id', 'Tv'];
    for (i = 0, j = uppers.length; i < j; i++)
        str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'),
            uppers[i].toUpperCase());

    return str;
};

String.prototype.toUpperFirst = function() {
    return this.substring(0, 1).toUpperCase() + this.substring(1);
};

String.prototype.toLowerFirst = function() {
    return this.substring(0, 1).toLowerCase() + this.substring(1);
};