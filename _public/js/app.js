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
;var NeDB, createDocumentStore, createRelationalStore, createSimpleStore;

NeDB = (typeof exports !== "undefined" && exports !== null) && exports || (this.NeDB = {});

NeDB.get = function() {
    var NeDB, datapath, e, store;
    try {
        NeDB = require("nedb");
        datapath = require('nw.gui').App.dataPath + "/nedb";
        store = {
            collection: function(name) {
                return new NeDB({
                    filename: "app/nedb/" + name,
                    autoload: true
                });
            }
        };
        return store;
    } catch (_error) {
        e = _error;
        if (e.code === "MODULE_NOT_FOUND") {
            return console.error("NeDB not found. Try `npm install nedb --save` inside of `/app/assets`.");
        } else {
            return console.error(e);
        }
    }
};
;/* Directives*/

angular.module('app.directives', ['app.services']).directive('appVersion', [
    'version', function(version) {
        return function(scope, elm, attrs) {
            return elm.text(version);
        };
    }
]);
;/* Filters*/

angular.module('app.filters', []).filter('interpolate', [
    'version', function(version) {
        return function(text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        };
    }
]);
;App.Global.controller(
    'AppCtrl',
    [
        '$scope', '$location', '$resource', '$rootScope', 'daemonManager', 'wallet',
        function($scope, $location, $resource, $rootScope, daemonManager, wallet) {

            $scope.wallet = wallet;

            $scope.daemon = {
                running: false
            };

            $scope.daemon.running = daemonManager.getHandler().isRunning();

            $scope.$on('daemon.initialized', function(result) {
                $scope.daemon.running = result;
            });

            $scope.$location = $location;
            $scope.$watch('$location.path()', function(path) {
                return $scope.activeNavId = path || '/';
            });

            return $scope.getClass = function(id) {
                if ($scope.activeNavId.substring(0, id.length) === id) {
                    return 'active';
                } else {
                    return '';
                }
            };

        }
    ]
);
;App.Global.controller(
    'InitializeCtrl',
    [
        '$scope', '$location', '$resource', '$rootScope', 'daemonManager', 'wallet',
        function($scope, $location, $resource, $rootScope, daemonManager, wallet) {

            var handler = daemonManager.getHandler();

            $scope.loadingStatus = 'Loading...';

            $scope.displayError = function (title, message) {
                $scope.loadingStatus = title;
                $scope.loadingStatusError = message;
            };

            $scope.initialize = function() {
                wallet.initialize();

                var promise = handler.start();

                // Already resolved?
                if (promise === false) {
                    $scope.displayError('Uh Oh!', handler.error);
                } else {
                    promise.then(function(result) {
                        if (result) {
                            $location.path('/dashboard');
                        } else {
                            $scope.displayError('Uh Oh!', handler.error);
                        }
                    });
                }
            };

            $scope.initialize();

        }
    ]
);
;/* Sevices*/

angular.module('app.services', []).factory('version', function() {
    return "0.1";
});
;App.Wallet.controller(
    'AddressesCtrl',
    [
        '$scope', function($scope) {
            return $scope;
        }
    ]
);
;App.Wallet.factory('wallet',
    [
        '$q',
        '$timeout',
        '$rootScope',
        'daemonManager',
        function ($q, $timeout, $rootScope, daemonManager) {

            var client = daemonManager.getClient();

            var WalletModel = function () {

                this.info = {
                    "version": "",
                    "protocolversion": "",
                    "walletversion": "",
                    "balance": 0,
                    "blocks": 0,
                    "timeoffset": 0,
                    "connections": 0,
                    "proxy": "",
                    "difficulty": 0,
                    "testnet": false,
                    "keypoololdest": 0,
                    "keypoolsize": 0,
                    "paytxfee": 0,
                    "mininput": 0.00,
                    "errors": ""
                };

                this.accounts = [

                ];

            };

            WalletModel.prototype = {

                send: function(data) {
                    var self = this;

                    client.exec('settxfee', data.fee, function(err, info) {
                        if (info || info == 'true') {
                            client.exec('sendtoaddress', data.address, parseFloat(data.amount), data.payerComment, data.payeeComment, function(err, info) {
                                if (err == null) {
                                    console.log("Transaction Complete");
                                } else {
                                    console.log(err);
                                }
                            });
                        }
                    });

                },

                updateInfo: function() {
                    var self = this;
                    client.exec('getinfo', function (err, info) {
                        if (err == null) {
                            self.info = info;
                            $rootScope.$apply();
                        }
                    });
                },

                updateAccounts: function() {

                    var async = require('async');
                    var self = this;

                    client.exec('listaccounts', function (err, accountList) {
                        if (err == null) {

                            var accounts = [];

                            for (var key in accountList) {
                                if (!accountList.hasOwnProperty(key)) continue;

                                (function (key) {
                                    async.series(
                                        {
                                            one: function(callback) {

                                                var newAccount = {
                                                    label: key,
                                                    balance: accountList[key],
                                                    address: ''
                                                };

                                                accounts.push(newAccount);

                                                client.exec('getaccountaddress', newAccount.label, function(err, address) {
                                                    if (err != null) {
                                                        console.log(err);
                                                        callback(false);
                                                    } else {
                                                        newAccount.address = address;
                                                        callback(true);
                                                    }
                                                });

                                            }
                                        },
                                        function (err, results) {
                                            self.accounts = accounts;
                                            $rootScope.$apply();
                                        }
                                    )
                                }(key));
                            }
                        }
                    });
                },

                initialize: function() {
                    var self = this;

                    $rootScope.$on('daemon.ready', function (ready) {
                        if (ready) {
                            self.updateInfo();
                            self.updateAccounts();
                        }
                    });

                    $rootScope.$on('daemon.notifications.block', function () {
                        self.updateInfo();
                        self.updateAccounts();
                    });

                }

            };

            return new WalletModel();
        }

    ]
);
;App.Wallet.DaemonHandler = (function () {

    function Handler ($q, $timeout, $rootScope) {

        this.$q = $q;
        this.$timeout = $timeout;
        this.$rootScope = $rootScope;

        this.db = NeDB.get().collection('settings');

        this.node = {
            os: require('os'),
            fs: require('fs'),
            gui: require('nw.gui'),
            childProcess: require('child_process')

        };

        this.daemonMap = {

            'linux': {
                'x32': 'daemons/reddcoind-linux32',
                'x64': 'daemons/reddcoind-linux64',
                'default': 'daemons/reddcoind-linux32'
            },

            'win32': {
                'x32': 'daemons/reddcoind-win32',
                'default': 'daemons/reddcoind-win32'
            },

            'darwin': {
                'x32': 'daemons/reddcoind-mac32',
                'x64': 'daemons/reddcoind-mac32',
                'default': 'daemons/reddcoind-mac-32'
            }

        };

        this.daemon = null;
        this.daemonFilePath = null;
        this.initialized = false;
        this.running = false;
        this.deferred = this.$q.defer();
        this.error = null;

    }

    Handler.prototype = {

        hasValidDaemon: function() {
            var platform = this.node.os.platform();
            return this.daemonMap[platform] !== undefined;
        },

        initializeFilePath: function() {
            var arch = this.node.os.arch();
            var platform = this.node.os.platform();

            if (this.daemonMap[platform] !== undefined) {
                // There is a platform, which means we can definitely run the default...
                if (this.daemonMap[platform][arch] == undefined) {
                    // Default architecture.. (likely will be 32bit)
                    this.daemonFilePath = this.daemonMap[platform]['default'];
                } else {
                    this.daemonFilePath = this.daemonMap[platform][arch];
                }
            }
        },

        isWindows: function() {
            return this.node.os.platform() === 'win32';
        },

        saveDaemonPid: function(callback) {
            var self = this;
            this.db.findOne({ "type": "daemon" }, function (err, doc) {
                if (doc == null) {
                    self.db.insert({
                        type: 'daemon',
                        pid: self.daemon.pid
                    }, function() {
                        typeof callback === 'function' && callback();
                    });
                } else {
                    doc.pid = self.daemon.pid;
                    self.db.update({_id:doc._id}, { $set: doc }, function() {
                        typeof callback === 'function' && callback();
                    });
                }
            });
        },

        killExistingPid: function(callback) {
            var self = this;
            this.db.findOne({ "type": "daemon" }, function (err, doc) {
                if (doc == null) return;
                try {
                    process.kill(doc.pid);
                    self.db.remove({_id:doc._id}, {});
                    typeof callback === 'function' && callback(true);
                } catch (error) {
                    // Could not kill, simple..
                    typeof callback === 'function' && callback(false);
                }
            });
        },

        start: function () {

            var self = this;

            if (this.isInitialized()) {
                console.log("Cannot start the daemon handler again without resetting first.");
                return this.deferred;
            } else if (!this.hasValidDaemon()) {
                this.error = 'This operating system does not support running the Reddcoin daemon.';
                this.deferred.reject(false);
                this.$rootScope.$broadcast('daemon.initialized', false);

                return false;
            }

            this.initializeFilePath();

            if (!this.node.fs.existsSync(this.daemonFilePath)) {
                this.error = 'Cannot find the daemon for this operating system ' +
                             '(' + this.node.os.platform() + ' ' + this.node.os.arch() + ').';

                this.deferred.reject(false);
                this.$rootScope.$broadcast('daemon.initialized', false);

                return false;
            }

            var win = this.node.gui.Window.get();

            if (!this.isWindows()) {
                this.node.childProcess.exec('chmod 777 ' + this.daemonFilePath);
            }

            // We need to kill any existing processes by the pid...
            this.killExistingPid();

            // We use a timeout to make sure the daemon is fully initialized.
            this.$timeout(function() {

                self.daemon = self.node.childProcess.spawn(self.daemonFilePath, [
                    '-alertnotify=echo "ALERT:%s"',
                    '-walletnotify=echo "WALLET:%s"',
                    //'-blocknotify=echo "BLOCK:%s"'
                ]);

                self.saveDaemonPid();

                setInterval(function() {
                    self.$rootScope.$emit('daemon.notifications.block');
                }, 30 * 1000);

                self.daemon.stdout.on('data', function (data) {
                    console.log("stdout data!");
                    //console.log(data);
                    self.$rootScope.$emit('daemon.notifications.block');
                });

                self.daemon.stderr.on('error', function (data) {
                    console.log('daemon error');
                });

                self.daemon.on('close', function (data) {
                    console.log("on daemon close");
                    console.log("Daemon child process has ended...");
                    //win.close();
                });

                win.on('close', function() {
                    self.daemon.kill();
                    this.close(true);
                });

                self.$timeout(function() {
                    self.running = true;
                    self.initialized = true;
                    self.deferred.resolve(true);
                    self.$rootScope.$broadcast('daemon.initialized', true);
                    self.$rootScope.$broadcast('daemon.ready', true);
                    console.log("Daemon Ready");
                }, 1500);

                return true;
            }, 500); // Resolve after delay so the child process has time to start...

            return this.deferred.promise;
        },

        isRunning: function() {
            return this.running;
        },

        isInitialized: function() {
            return this.initialized;
        }

    };

    return Handler;

}());
;App.Wallet.factory('daemonManager',
    [
        '$q',
        '$timeout',
        '$rootScope',
        function($q, $timeout, $rootScope) {

            var handler = new App.Wallet.DaemonHandler($q, $timeout, $rootScope);

            var client = require('node-reddcoin')({
                user: 'user',
                pass: 'password'
            });

            return {

                getClient: function () {
                    return client;
                },

                getHandler: function() {
                    return handler;
                }

            };

        }

    ]
);
;App.Wallet.controller(
    'DashboardCtrl',
    [
        '$scope',
        'daemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

            $scope.wallet = wallet;



        }
    ]
);
;App.Wallet.controller(
    'ReceiveCtrl',
    [
        '$scope',
        'daemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

            $scope.wallet = wallet;



        }
    ]
);
;App.Wallet.controller(
    'SendCtrl',
    [
        '$scope',
        'daemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

            $scope.wallet = wallet;

            $scope.send = {
                amount: 1,
                address: 'Rer7K4AwRhUYshzzPeamRkC9cV7M6BSz3P',
                payerComment: '',
                payeeComment: '',
                fee: 0.001
            };

            $scope.meta = {
                totalAmount: 0
            };

            $scope.confirmSend = function() {
                wallet.send($scope.send);
            };

            $scope.updateMetaTotal = function() {
                var result = parseFloat($scope.send.amount) + parseFloat($scope.send.fee);
                if (result == null || result == undefined || isNaN(result)) {
                    result = "Invalid Amount";
                }
                $scope.meta.totalAmount = result;
            };

            $scope.updateMetaTotal();

        }
    ]
);
;App.Wallet.controller(
    'TransactionsCtrl',
    [
        '$scope', function($scope) {
            return $scope;
        }
    ]
);
;
//# sourceMappingURL=app.js.map