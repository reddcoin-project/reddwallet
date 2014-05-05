App.Daemon.factory('DaemonManager',
    [
        '$q',
        '$timeout',
        '$rootScope',
        function($q, $timeout, $rootScope) {

            function Manager() {

                this.running = false;

                this.bootstrap = new App.Daemon.Bootstrap($q, $timeout, $rootScope);

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