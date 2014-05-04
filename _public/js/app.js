'use strict';

var App = angular.module('app', ['ngCookies', 'ngResource', 'ngRoute', 'ngAnimate', 'app.wallet', 'app.global', 'app.daemon', 'app.directives', 'app.filters', 'app.services', 'partials']);

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

            .when('/initialize', { controller: 'InitializeCtrl', templateUrl: '/partials/initialize.html' })
            .otherwise({ redirectTo: '/dashboard' });

        return $locationProvider.html5Mode(false);
    }
]);

App.run(['$rootScope', '$route', '$location', 'DaemonManager', function ($rootScope, $route, $location, DaemonManager) {

    $rootScope.$on("$routeChangeStart", function (event, next) {
        if (next != undefined && next.$$route != undefined) {

            if (!DaemonManager.isRunning()) {
                $location.path('/initialize');
            }

        }
    });

}]);
;App.Daemon.Bootstrap = (function () {

    /**
     * The Daemon Bootstrapper initializes a local daemon for use with the wallet. It will return a
     * promise that resolves to a standard Message object indicating if it succeeded or not.
     *
     * @param $q
     * @param $timeout
     * @param $rootScope
     * @constructor
     */

    function Bootstrap ($q, $timeout, $rootScope) {

        this.debugEnabled = true;

        this.$q = $q;
        this.$timeout = $timeout;
        this.$rootScope = $rootScope;

        this.os = require('os');
        this.fs = require('fs');
        this.daemon = null;
        this.deferred = $q.defer();
        this.daemonFilePath = null;
        this.gui = require('nw.gui');
        this.win = this.gui.Window.get();
        this.childProcess = require('child_process');

        this.dbSettings = App.Global.NeDB.collection('settings');

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
    }

    Bootstrap.prototype = {

        /**
         * # Main Function
         *
         * Start the local daemon
         */
        startLocal: function () {

            var self = this;
            var message = this.runPreChecks();

            if (!message.result) {
                this.debug(message.message);

                this.deferred.reject(message);
                self.$rootScope.$broadcast('daemon.bootstrapped', message);

                return this.deferred.promise;
            }

            this.runOsSpecificTasks();

            this.killExistingPid();

            this.spawnDaemon();

            this.setupDaemonListeners()

            // We will do a timeout function to give the daemon change to initialize..
            this.$timeout(function() {
                var message = new App.Global.Message(true, 0, 'Daemon Ready');

                self.$rootScope.$broadcast('daemon.bootstrapped', message);
                self.deferred.resolve(message);

                self.debug(message);
            }, 1000);

            // Setup an internal to emit a notification of a 'block' as want the wallet to stay up to date even
            // if no actions are performed. If the wallet is connected to an already started external daemon
            // then we wont receive its alerted notifications.
            // This wallet is not designed to connect to daemons outside of a local network as it may be sluggish.
            setInterval(function() {
                self.$rootScope.$broadcast('daemon.notifications.block');
            }, 15 * 1000);

            return this.deferred.promise;
        },

        /**
         * The daemon outputs various data, setup listeners to catch this fire and off events.
         */
        setupDaemonListeners: function () {
            var self = this;

            this.daemon.stdout.on('data', function (data) {
                self.debug("Received daemon data from 'stdout'");
                self.$rootScope.$emit('daemon.notifications.block');
            });

            this.daemon.stderr.on('error', function (data) {
                self.debug("Received daemon error from 'stderr'");
            });

            // When the main window (the one starting this) is closed, kill the daemon.
            this.win.on('close', function() {
                self.daemon.kill('SIGTERM', function() {
                    self.debug("Daemon killed");
                });

                this.close(true);
            });

            this.daemon.on('close', function (data) {
                self.debug("Daemon child process has ended.");
            });
        },

        /**
         * Spawns the daemon.
         */
        spawnDaemon: function() {
            this.daemon = this.childProcess.spawn(this.daemonFilePath, [
                '-alertnotify=echo "ALERT:%s"',
                '-walletnotify=echo "WALLET:%s"'
                //'-blocknotify=echo "BLOCK:%s"'
            ]);

            this.saveDaemonPid();
        },

        /**
         * Checks that the daemon can run on the OS, initialises the path to the daemon & makes sure
         * the daemon actually exists.
         *
         * @returns {App.Global.Message}
         */
        runPreChecks: function () {
            if (!this.hasValidDaemon()) {
                return new App.Global.Message(
                    false, 1, 'This operating system does not support running the Reddcoin daemon.'
                );
            }

            this.initializeFilePath();

            if (!this.fs.existsSync(this.daemonFilePath)) {
                var platform = this.os.platform() + ' ' + this.os.arch();
                return new App.Global.Message(
                    false, 2, 'Cannot find the daemon for this operating system: ' + platform
                );
            }

            return new App.Global.Message(true, 0, 'Pre-checks complete');
        },

        /**
         * Runs commands based on the OS, on *nix you need the chmod the daemon just in case.
         */
        runOsSpecificTasks: function() {
            if (!this.isWindows()) {
                this.childProcess.exec('chmod 777 ' + this.daemonFilePath);
            }
        },

        /**
         * If a platform is found, the daemon has to have a workable version on the OS.
         *
         * @returns {boolean}
         */
        hasValidDaemon: function() {
            var platform = this.os.platform();
            return this.daemonMap[platform] !== undefined;
        },

        /**
         * Gets the correct path to the daemon.
         */
        initializeFilePath: function() {
            var osArch = this.os.arch();
            var osPlatform = this.os.platform();

            var platform = this.daemonMap[osPlatform];

            if (platform !== undefined) {
                // There is a platform, which means we can definitely run the default...
                if (platform[osArch] == undefined) {
                    // Default architecture.. (likely will be 32bit)
                    this.daemonFilePath = platform['default'];
                } else {
                    this.daemonFilePath = platform[osArch];
                }
            }
        },

        /**
         * Save the current daemon process ID to the database, this is so we
         * can kill any daemon upon restart if it didn't get closed.
         *
         * @param {function=} callback
         */
        saveDaemonPid: function(callback) {
            var self = this;
            this.dbSettings.findOne({ "type": "daemon" }, function (err, doc) {
                if (doc == null) {
                    self.dbSettings.insert({
                        type: 'daemon',
                        pid: self.daemon.pid
                    }, function() {
                        typeof callback === 'function' && callback();
                    });
                } else {
                    doc.pid = self.daemon.pid;
                    self.dbSettings.update({_id:doc._id}, { $set: doc }, function() {
                        typeof callback === 'function' && callback();
                    });
                }
            });
        },

        /**
         * Retrieves the previously saved process ID and tries to kill it, it then deletes
         * the record from the DB.
         *
         * @param {function=} callback
         */
        killExistingPid: function(callback) {
            var self = this;
            this.dbSettings.findOne({ "type": "daemon" }, function (err, doc) {
                if (doc == null) return;

                try {
                    process.kill(doc.pid);

                    self.dbSettings.remove({"type": "daemon"}, {});

                    typeof callback === 'function' && callback(true);
                } catch (error) {
                    self.debug(error);

                    typeof callback === 'function' && callback(false);
                }
            });
        },

        /**
         * Returns the promise that is resolved when the daemon is initialized.
         *
         * @returns {promise|defer.promise|Promise.promise|Q.promise}
         */
        getPromise: function() {
            return this.deferred.promise;
        },

        /**
         * Determines whether the current platform is windows or not.
         *
         * @returns {boolean}
         */
        isWindows: function() {
            return this.os.platform() === 'win32';
        },

        /**
         * If debugging is enabled, it will log it to the console.
         *
         * @param data
         */
        debug: function (data) {
            if (this.debugEnabled) {
                console.log(data);
            }
        }

    };


    return Bootstrap;

}());

;App.Daemon.factory('DaemonManager',
    [
        '$q',
        '$timeout',
        '$rootScope',
        function($q, $timeout, $rootScope) {

            function Manager() {

                this.running = false;

                this.bootstrap = new App.Daemon.Bootstrap($q, $timeout, $rootScope);

                this.client = require('node-reddcoin')({
                    user: 'user',
                    pass: 'password'
                });

                this.initialize();

            }

            Manager.prototype = {

                initialize: function() {
                    var self = this;

                    /**
                     * This promise callback will set the running bool once the bootstrap has completed.
                     *
                     * @param {App.Global.Message} message
                     */
                    this.bootstrap.getPromise().then(function(message) {
                        self.running = message.result;

                        return message;
                    });

                },

                getClient: function () {
                    return this.client;
                },

                getBootstrap: function() {
                    return this.bootstrap;
                },

                isRunning: function() {
                    return this.running;
                }

            };

            return new Manager();

        }

    ]
);
;App.Global.controller(
    'AppCtrl',
    [
        '$scope', '$location', '$resource', '$rootScope', 'DaemonManager', 'wallet',
        function($scope, $location, $resource, $rootScope, DaemonManager, wallet) {

            $scope.wallet = wallet;

            $scope.daemon = {
                running: false
            };

            $rootScope.$on('daemon.bootstrapped', function(event, message) {
                $scope.daemon.running = message.result;
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
        '$scope', '$location', '$resource', '$rootScope', 'DaemonManager', 'wallet',
        function($scope, $location, $resource, $rootScope, DaemonManager, wallet) {

            var bootstrap = DaemonManager.getBootstrap();

            $scope.loadingStatus = 'Loading...';

            $scope.displayError = function (title, message) {
                $scope.loadingStatus = title;
                $scope.loadingStatusError = message;
            };

            $scope.initialize = function() {
                wallet.initialize();

                var promise = bootstrap.startLocal();

                promise.then(function(message) {
                    if (message.result) {
                        $location.path('/dashboard');
                    } else {
                        $scope.displayError('Uh Oh!', message.message);
                    }
                });

            };

            $scope.initialize();

        }
    ]
);
;App.Global.Message = (function () {

    /**
     * A rigid message object used to pass data around.
     *
     * @param result
     * @param message
     * @param code
     * @param extra
     * @constructor
     */
    function Message (result, code, message, extra) {
        this.result = result;
        this.message = message;
        this.code = code;

        if (extra != undefined) {
            for (var key in extra) {
                if (!extra.hasOwnProperty(key)) continue;
                this[key] = extra[key];
            }
        }
    }

    Message.prototype = {



    };

    return Message;

}());

/*
 Error Codes
 ===========

 1 : The operating system running the application does not have a supported reddcoind daemon.
 2 : The deamon for the selected operating system cannot be find, most likely a file path issue or
     was failed to be bundled with the wallet.
 3 :


*/

;var neDbInstance = null;

App.Global.NeDB = (function () {

    var NeDB = function () {

    };

    NeDB.prototype = {

        get: function () {

            var NeDB, datapath, e, store;
            try {
                NeDB = require("nedb");
                datapath = require('nw.gui').App.dataPath + "/nedb";
                store = {
                    collection: function (name) {
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
        }

    };

    if (neDbInstance == null) {
        neDbInstance = new NeDB().get();
    }

    return neDbInstance;

}());
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
        'DaemonManager',
        function ($q, $timeout, $rootScope, DaemonManager) {

            var client = DaemonManager.getClient();

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

                    $rootScope.$on('daemon.bootstrapped', function (event, message) {
                        if (message.result) {
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
;App.Wallet.controller(
    'DashboardCtrl',
    [
        '$scope',
        'DaemonManager',
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
        'DaemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

            $scope.wallet = wallet;

            $scope.copy = function ($index) {

                // Load native UI library
                var gui = require('nw.gui');

                // We can not create a clipboard, we have to receive the system clipboard
                var clipboard = gui.Clipboard.get();

                // Set the address..
                clipboard.set($scope.wallet.accounts[$index].address);

            };

        }
    ]
);
;App.Wallet.controller(
    'SendCtrl',
    [
        '$scope',
        'DaemonManager',
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
;/* Sevices*/

angular.module('app.services', []).factory('version', function() {
    return "0.1";
});
;
//# sourceMappingURL=app.js.map