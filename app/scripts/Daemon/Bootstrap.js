App.Daemon.Bootstrap = (function () {

    /**
     * The Daemon Bootstrapper initializes a local daemon for use with the wallet. It will return a
     * promise that resolves to a standard Message object indicating if it succeeded or not.
     *
     * @param $q
     * @param $timeout
     * @param $interval
     * @param $rootScope
     * @param walletDb
     * @constructor
     */

    function Bootstrap ($q, $timeout, $interval, $rootScope, walletDb) {

        this.debugEnabled = false;
        this.killMethod = 'pid'; // either pid or daemon (buggy atm)

        this.$q = $q;
        this.$timeout = $timeout;
        this.$interval = $interval;
        this.$rootScope = $rootScope;
        this.walletRpc = walletDb.walletRpc;

        this.os = require('os');
        this.fs = require('fs');
        this.daemon = null;

        this.deferred = $q.defer();

        this.daemonFilePath = null;
        this.gui = require('nw.gui');
        this.app = this.gui.App;
        this.win = this.gui.Window.get();
        this.childProcess = require('child_process');

        this.daemonDirPath = this.app.dataPath + '/daemon';
        this.configPath = this.daemonDirPath + "/reddcoin.conf";
        this.pidPath = this.daemonDirPath + "/reddwallet.pid";

        this.daemonConfig = {};

        this.daemonMap = {
            'linux': {
                'x32': 'daemons/reddcoind-linux-32',
                'x64': 'daemons/reddcoind',
                'default': 'daemons/reddcoind-linux-32'
            },
            'win32': {
                'x32': 'daemons/reddcoind-win-32.exe',
                'x64': 'daemons/reddcoind-win-32.exe',
                'default': 'daemons/reddcoind-win-32.exe'
            },
            'darwin': {
                'x32': 'daemons/reddcoind-mac-32',
                'x64': 'daemons/reddcoind-mac-32',
                'default': 'daemons/reddcoind-mac-32'
            }
        };
    }

    Bootstrap.prototype = {

        /**
         * # Main Function

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

            var promise = this.initializeConfiguration();

            promise.then(
                function success () {
                    self.parseConfigurationFile();

                    self.runOsSpecificTasks();

                    var killPromise = self.killExistingPid();

                    killPromise.then(
                        function success() {
                            self.startDaemonLaunch();
                        },
                        function error() {
                            self.startDaemonLaunch();
                        }
                    );
                },
                function error (err) {
                    self.deferred.reject(new App.Global.Message(false, 4, err));
                }
            );


            return this.deferred.promise;
        },

        startDaemonLaunch: function() {
            var self = this;

            // Also initialize the walletRpc configuration..
            // This is so we can use an RPC call to wait on the daemon to start..
            this.walletRpc.initializeConfig(this.daemonConfig);

            this.spawnDaemon();

            this.saveDaemonPid();

            this.setupDaemonListeners();

            // We will do an interval function to check every second to see if the daemon has loaded.
            var daemonStartedSuccess = function success (message) {
                self.debug("Daemon has started started.");

                var newMessage = new App.Global.Message(true, 0, 'Daemon Ready');

                self.deferred.resolve(newMessage);

                self.$rootScope.$broadcast('daemon.bootstrapped', newMessage);

                self.debug(newMessage);

                // Setup an internal to emit a notification of a 'block' as want the wallet to stay up to date even
                // if no actions are performed. If the wallet is connected to an already started external daemon
                // then we wont receive its alerted notifications.
                // This wallet is not designed to connect to daemons outside of a local network as it may be sluggish.
                var blockInterval = self.$interval(function() {
                    self.$rootScope.$broadcast('daemon.notifications.block');
                }, 5 * 1000);

                self.walletRpc.updateWalletLock();

                self.$interval.cancel(intervalCode);

            };

            var intervalCode = this.$interval(function() {
                self.walletRpc.lockWallet().then(
                    daemonStartedSuccess,
                    function error (message) {
                        if (message.rpcError.code == 'ECONNREFUSED') {
                            self.debug("Daemon still not started..");
                            self.debug(message);
                        } else if (message.rpcError.code == -15) {
                            daemonStartedSuccess(message);
                            self.debug("Error code -15, not encrypted");
                        } else {
                            self.debug(message);
                        }
                    }
                );

            }, 1000);
        },

        /**
         * This will check if the data directory contains the ReddWallet daemon folder & configuration. If it doesn't
         * then it will create the folder and configuration file. After that it will set the config by reading the file.
         */
        initializeConfiguration: function() {
            var deferred = this.$q.defer();

            try {

                if (!this.fs.existsSync(this.daemonDirPath)) {
                    this.fs.mkdirSync(this.daemonDirPath);
                }

                if (!this.fs.existsSync(this.configPath)) {
                    var defaultConf = this.fs.readFileSync('daemons/reddcoin.default.conf', {
                        encoding: 'utf8'
                    });

                    var self = this;
                    // Replace the %PASSWORD with a random value..
                    var crypto = require('crypto');
                    crypto.randomBytes(32, function(ex, buf) {
                        if (ex == null) {
                            defaultConf = defaultConf.replace("%PASSWORD", crypto.pseudoRandomBytes(32).toString('hex'));
                        } else {
                            defaultConf = defaultConf.replace("%PASSWORD", buf.toString('hex'));
                        }

                        self.fs.writeFileSync(self.configPath, defaultConf);
                        deferred.resolve();
                    });
                } else {
                    // Resole immediately as the files already exist.
                    deferred.resolve();
                }

            } catch (ex) {
                deferred.reject(ex);
            }

            return deferred.promise;
        },

        parseConfigurationFile: function () {

            try {
                var conf = this.fs.readFileSync(this.configPath, {
                    encoding: 'utf8'
                });
            } catch (ex) {
                this.debug("An error occurred trying to read the config file " + this.configPath);
                this.debug(ex);
            }

            var lines = conf.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var parts = lines[i].split("=");
                if (parts.length == 2) {
                    this.daemonConfig[parts[0].trim()] = parts[1].trim();
                }
            }

            this.debug(this.daemonConfig);
        },

        /**
         * The daemon outputs various data, setup listeners to catch this fire and off events.
         */
        setupDaemonListeners: function () {
            var self = this;

            this.daemon.stdout.on('data', function (data) {
                if (data.indexOf != undefined) {
                    console.log(data);
                    if (data.indexOf('WALLET') !== -1 || data.indexOf('ALERT') !== -1) {
                        self.$rootScope.$emit('daemon.notifications.block');
                        console.log("notifications block");
                    }
                }
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
                self.fs.unlink(self.pidPath, function(ex) {
                    if (ex != null) {
                        self.debug(ex);
                    }
                });
                self.debug("Daemon child process has ended.");
            });
        },

        /**
         * Spawns the daemon.
         */
        spawnDaemon: function() {
            this.daemon = this.childProcess.spawn(this.daemonFilePath, [
                '-conf=' + this.configPath,
                '-datadir=' + this.daemonDirPath,
                '-pid=' + this.pidPath,
                '-alertnotify=echo "ALERT:%s"',
                '-walletnotify=echo "WALLET:%s"'
                //'-blocknotify=echo "BLOCK:%s"'
            ]);
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
            this.fs.writeFileSync(this.pidPath, this.daemon.pid, {
                flag: 'w'
            });
        },

        /**
         * Retrieves the previously saved process ID and tries to kill it, it then deletes
         * the record from the DB.
         *
         */
        killExistingPid: function() {
            var self = this;
            var deferred = this.$q.defer();

            if (this.killMethod == 'pid') {
                if (this.fs.existsSync(this.pidPath)) {
                    var pid = this.fs.readFileSync(this.pidPath, {
                        encoding: 'utf8'
                    });
                    try {
                        process.kill(pid, 'SIGTERM');
                        this.$timeout(function() {
                            self.debug("Resolved");
                            deferred.resolve(true);
                        }, 500);
                    } catch (ex) {
                        this.debug("Error trying to kill pid, most likely no process exists with that pid");
                        deferred.reject(false);
                    }
                } else {
                    deferred.resolve(true);
                }
            }

            if (this.killMethod == 'daemon') {
                try {
                    this.childProcess.exec(this.daemonFilePath, [
                        '-conf=' + this.configPath,
                        '-datadir=' + this.daemonDirPath,
                        '-pid=' + this.pidPath,
                        'stop'
                    ], function() {
                        self.$timeout(function() {
                            self.debug("Tried killing any daemons using built-in method.")
                            deferred.resolve(true);
                        }, 500);
                    });
                } catch (ex) {
                    self.debug(ex);
                    deferred.reject(false);
                }
            }

            return deferred.promise;
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
