App.Wallet.DaemonHandler = (function () {

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
                    self.db.remove({"type": "daemon"}, {});
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