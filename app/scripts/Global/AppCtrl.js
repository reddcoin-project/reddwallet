App.Global.controller(
    'AppCtrl',
    [
        '$scope', '$interval', '$location', '$resource', '$rootScope', 'walletDb', 'DaemonManager',
        function($scope, $interval, $location, $resource, $rootScope, walletDb, daemon) {

            $scope.walletDb = walletDb;

            $scope.walletOverview = {};

            $scope.ircMessages = 0;

            $rootScope.$on('irc.message.highlight', function (event) {
                console.log("event");
                if ($scope.activeNavId == '/irc') {
                    return;
                }

                $scope.ircMessages ++;
            });

            $scope.daemon = {
                running: false
            };

            daemon.getBootstrap().getPromise().then(function(message) {
                fetchOverview();
                $scope.walletDb.syncAccounts();
                $scope.daemon.running = true;

                var interval = setInterval(fetchOverview, 15000);
            });

            function fetchOverview() {
                $scope.walletDb.updateOverview().then(function (message) {
                    $scope.walletOverview = $scope.walletDb.overviewModel;
                });
                $scope.walletDb.getTransactions();
            }

            $scope.$location = $location;
            $scope.$watch('$location.path()', function(path) {
                if (path == '/irc') {
                    $scope.ircMessages = 0;
                }

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