App.Global.controller(
    'AppCtrl',
    [
        '$scope', '$location', '$resource', '$rootScope', 'DaemonManager', 'wallet',
        function($scope, $location, $resource, $rootScope, DaemonManager, wallet) {

            $scope.wallet = wallet;

            $scope.daemon = {
                running: false
            };

            $rootScope.$on('daemon.bootstrapped', function(event, message) {
                $scope.daemon.running = message.result;
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