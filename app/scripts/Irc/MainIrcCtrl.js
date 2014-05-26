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

            $scope.ircTitle = "Chat";

            $scope.nickname = IrcManager.nickname;
            $scope.password = '';

            $scope.irc = IrcManager;

            $scope.connect = function () {
                if (!IrcManager.isConnected()) {
                    IrcManager.connect($scope.nickname, $scope.nickname, $scope.password);
                }
            };

            $scope.sendMessage = function () {
                $scope.irc.send($scope.irc.mainChannel, $scope.message);

                $scope.message = '';
            }

        }
    ]
);