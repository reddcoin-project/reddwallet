App.Global.controller(
    'InitializeCtrl',
    [
        '$scope', '$location', '$resource', '$rootScope', '$sce', 'DaemonManager',
        function($scope, $location, $resource, $rootScope, $sce, DaemonManager) {

            var bootstrap = DaemonManager.getBootstrap();

            bootstrap.getPromise().then(
                function success(message) {
                    if (message.result) {
                        $location.path('/dashboard');
                    }

                    return message;
                },
                function error (message) {
                    $scope.displayError('Uh Oh!', message.message);
                }
            );

            $scope.loadingStatus = 'ReddWallet';

            $scope.displayError = function (title, message) {
                $scope.loadingStatus = title;
                $scope.loadingStatusError = $sce.trustAsHtml(message.replace(/(?:\n)/g, '<hr>'));
            };

            $scope.initialize = function() {
                // WHERE IT ALL BEGINS, THE BIRTH OF THE WALLET!
                bootstrap.startLocal();
            };

            $scope.initialize();

        }
    ]
);