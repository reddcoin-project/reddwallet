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
                    this.running = false;
                    this.deferred = $q.defer();
                    this.walletConfig = new App.Wallet.ConfigParser().getConfig();
                    this.daemonLocal = this.walletConfig.config.localDaemon.enabled;

                    this.bootstrap = new App.Daemon.Bootstrap(
                        $q,
                        $timeout,
                        $interval,
                        $rootScope,
                        this.walletConfig,
                        walletDb
                    );

                },

                start: function () {
                    var self = this;

                    /**
                     * This will run the local daemon and wrap that daemons promise in its own one. (Managers promise).
                     *
                     * This way abstracts the other files relying on this promise. So they won't even know what type
                     * of daemon has been loaded. Just that everything has been initialized.
                     */
                    if (this.isDaemonLocal()) {

                        // Wrap the promises
                        this.getBootstrap().getPromise().then(
                            function success(message) {
                                self.running = message.result;
                                self.deferred.resolve(message);
                                return message;
                            },
                            function error(message) {
                                self.deferred.reject(message);
                            }
                        );

                        // Start
                        this.getBootstrap().startLocal();
                    } else {
                        // Remote daemon
                    }
                },

                isDaemonLocal: function () {
                    return this.daemonLocal;
                },

                getPromise: function () {
                    return this.deferred;
                },

                killDaemon: function () {
                    this.getBootstrap().killDaemon();
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