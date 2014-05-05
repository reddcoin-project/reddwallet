App.Global.controller(
    'InitializeCtrl',
    [
        '$scope', '$location', '$resource', '$rootScope', 'DaemonManager',
        function($scope, $location, $resource, $rootScope, DaemonManager) {

            var bootstrap = DaemonManager.getBootstrap();

            bootstrap.getPromise().then(
                function success(message) {
                    if (message.result) {
                        //$location.path('/login');
                    }

                    return message;
                },
                function error (message) {
                    $scope.displayError('Uh Oh!', message.message);
                }
            );

            $scope.loadingStatus = 'Loading...';

            $scope.displayError = function (title, message) {
                $scope.loadingStatus = title;
                $scope.loadingStatusError = message;
            };

            $scope.initialize = function() {
                // WHERE IT ALL BEGINS, THE BIRTH OF THE WALLET!
                bootstrap.startLocal();
            };

            $scope.initialize();

        }
    ]
);