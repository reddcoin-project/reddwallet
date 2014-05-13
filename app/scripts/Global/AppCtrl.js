App.Global.controller(
    'AppCtrl',
    [
        '$scope', '$interval', '$location', '$resource', '$rootScope', 'walletDb', 'DaemonManager',
        function($scope, $interval, $location, $resource, $rootScope, walletDb, daemon) {

            $scope.walletDb = walletDb;

            $scope.walletOverview = {};

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
            }

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