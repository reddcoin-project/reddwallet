App.Irc.controller(
    'MainIrcCtrl',
    [
        '$scope',
        '$alert',
        '$modal',
        '$timeout',
        'IrcManager',
        function ($scope, $alert, $modal, $timeout, IrcManager) {

            $scope.glued = true;
            $scope.message = '';

            $scope.irc = IrcManager;

            if (!IrcManager.isConnected()) {
                IrcManager.connect("reddwallet", "hippo");
            }

            $scope.sendMessage = function () {
                $scope.irc.send($scope.irc.mainChannel, $scope.message);

                $scope.message = '';
            }

        }
    ]
);