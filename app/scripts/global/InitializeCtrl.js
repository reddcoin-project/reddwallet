App.Global.controller(
    'InitializeCtrl',
    [
        '$scope', '$location', '$resource', '$rootScope', 'daemonManager', 'wallet',
        function($scope, $location, $resource, $rootScope, daemonManager, wallet) {

            var handler = daemonManager.getHandler();

            $scope.loadingStatus = 'Loading...';

            $scope.displayError = function (title, message) {
                $scope.loadingStatus = title;
                $scope.loadingStatusError = message;
            };

            $scope.initialize = function() {
                wallet.initialize();

                var promise = handler.start();

                // Already resolved?
                if (promise === false) {
                    $scope.displayError('Uh Oh!', handler.error);
                } else {
                    promise.then(function(result) {
                        if (result) {
                            $location.path('/dashboard');
                        } else {
                            $scope.displayError('Uh Oh!', handler.error);
                        }
                    });
                }
            };

            $scope.initialize();

        }
    ]
);