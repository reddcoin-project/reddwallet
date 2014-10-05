'use strict';

/**
 * Initialise the main App module and its dependencies & sub modules.
 *
 */
var App = angular.module('app', [

    // Dependencies
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngAnimate',
    'ngTable',
    'ngSanitize',
    'nwFileDialog',

    'mgcrea.ngStrap',
    'pasvaz.bindonce',
    'luegg.directives',
    'perfect_scrollbar',

    // Sub Modules
    'app.wallet',
    'app.global',
    'app.daemon',
    'app.irc',
    'app.directives',
    'app.filters',
    'app.services',
    'partials'

]);

/**
 * Require public objects
 *
 * @public
 */

var _ = require('lodash');
var nwGui = require('nw.gui');
var nwWin = nwGui.Window.get();
var nodeFs = require('fs');

/**
 * Set up accessible variables for some of the modules.
 */

//require('nw.gui').Window.get().showDevTools();
App.Wallet = angular.module('app.wallet', []);
App.Global = angular.module('app.global', []);
App.Daemon = angular.module('app.daemon', []);
App.Utils = angular.module('app.utils', []);
App.Irc = angular.module('app.irc', []);

/**
 * Routes configuration.
 */

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
            .when('/statistics', { controller: 'StatisticsCtrl', templateUrl: '/partials/statistics.html' })
            .when('/irc', { controller: 'MainIrcCtrl', templateUrl: '/partials/irc-main.html' })
            .when('/help', { controller: 'HelpCtrl', templateUrl: '/partials/help.html' })

            .otherwise({ redirectTo: '/dashboard' });

        return $locationProvider.html5Mode(false);
    }
]);

/**
 * Default configuration for the alerts.
 */

App.config(['$alertProvider', function($alertProvider) {
    angular.extend($alertProvider.defaults, {
        animation: 'am-fade',
        placement: 'bottom-right',
        duration: 5,
        container: '#alerts-container'
    });
}]);

/**
 * This will run once Angular has configured and set up everything it needs to.
 */

App.run(['$rootScope', '$route', '$location', 'DaemonManager', function ($rootScope, $route, $location, DaemonManager) {

    /**
     * Here we set up the applications miscellaneous stuff such as shortcuts and menus.
     */

    var option = {
        key : "Ctrl+Q",
        active : function() {
            nwGui.App.quit();
        },
        failed : function(msg) {
            console.log(msg);
        }
    };

    // Create a shortcut with |option|.
    var quitShortcut = new nwGui.Shortcut(option);

    /**
     * Set up Mac OSX text shortcut functions such as copy & paste.
     */

    var nativeMenuBar = new nwGui.Menu({ type: "menubar" });

    try {
        nativeMenuBar.createMacBuiltin("ReddWallet");
        nwWin.menu = nativeMenuBar;
    } catch (ex) {
        console.log(ex.message);
    }

    /**
     * If the daemon is not initialized (loaded) then we will redirect them to the /initialize page.
     */

    $rootScope.$on("$routeChangeStart", function (event, next) {
        if (next != undefined && next.$$route != undefined) {

            if (!DaemonManager.isRunning()) {
                $location.path('/initialize');
            }

        }
    });

}]);