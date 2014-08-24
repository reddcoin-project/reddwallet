App.Daemon.factory('DaemonManager',
    [
        '$q',
        '$timeout',
        '$interval',
        '$rootScope',
        'walletDb',
        function($q, $timeout, $interval, $rootScope, walletDb) {

            function Manager() {
                this.initialize();
            }

            Manager.prototype = {

                initialize: function() {
                    var self = this;
                    this.running = false;

                    var configParser = new App.Wallet.ConfigParser();
                    this.walletConfig = configParser.getConfig();
                    this.bootstrap = new App.Daemon.Bootstrap($q, $timeout, $interval, $rootScope, this.walletConfig, walletDb);

                    // Hook the running property to the promise of the bootstrap.
                    this.bootstrap.getPromise().then(function(message) {
                        self.running = message.result;

                        return message;
                    });

                },

                killDaemon: function () {
                    this.bootstrap.killDaemon();
                },

                getBootstrap: function() {
                    return this.bootstrap;
                },

                getConfig: function () {
                    return this.walletConfig;
                },

                isRunning: function() {
                    return this.running;
                }

            };

            return new Manager();

        }

    ]
);