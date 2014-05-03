App.Wallet.DaemonHandler = (function () {

    function Handler ($q, $timeout, $rootScope) {

        this.$q = $q;
        this.$timeout = $timeout;
        this.$rootScope = $rootScope;

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
        this.lastNotification = new Date().getTime();

    }

    Handler.prototype = {

        hasValidDaemon: function() {
            var arch = this.node.os.arch();
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

        start: function () {

            if (this.isInitialized()) {
                console.log("Cannot start the daemon handler again without resetting first.");
                return this.deferred;
            }

            if (!this.hasValidDaemon()) {
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

            this.daemon = this.node.childProcess.spawn(this.daemonFilePath, [
                '-alertnotify=echo "ALERT:%s"',
                '-blocknotify=echo "BLOCK:%s"',
                '-walletnotify=echo "WALLET:%s"'
            ]);

            setInterval(function() {
                self.$rootScope.$emit('daemon.notifications.block');
            }, 30 * 1000);

            this.daemon.stdout.on('data', function (data) {
                self.$rootScope.$emit('daemon.notifications.block');
            });

            this.daemon.stderr.on('data', function (data) {
                win.close();
            });

            this.daemon.on('close', function (data) {
                console.log("Daemon child process has ended...");
                //win.close();
            });

            win.on('close', function() {
                self.daemon.kill();
                this.close(true);
            });

            // We use a timeout to make sure the daemon is fully initialized.
            var self = this;
            this.$timeout(function() {

                self.running = true;
                self.initialized = true;
                self.deferred.resolve(true);
                self.$rootScope.$broadcast('daemon.initialized', true);
                self.$rootScope.$broadcast('daemon.initialization.success');

                return true;
            }, 1000); // Resolve after delay so the child process has time to start...

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