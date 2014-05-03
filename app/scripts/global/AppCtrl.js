App.Global.controller(
    'AppCtrl',
    [
        '$scope', '$location', '$resource', '$rootScope', 'daemonManager', 'wallet',
        function($scope, $location, $resource, $rootScope, daemonManager, wallet) {

            $scope.wallet = wallet;

            $scope.daemon = {
                running: false
            };

            $scope.daemon.running = daemonManager.getHandler().isRunning();

            $scope.$on('daemon.initialized', function(result) {
                $scope.daemon.running = result;
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