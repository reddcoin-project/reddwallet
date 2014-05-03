App.Wallet.factory('daemonManager',
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