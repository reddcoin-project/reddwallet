App.Irc.controller(
    'MainIrcCtrl',
    [
        '$scope',
        '$alert',
        '$modal',
        '$timeout',
        'IrcManager',
        'settingsDb',
        function ($scope, $alert, $modal, $timeout, IrcManager, settingsDb) {

            $scope.glued = true;

            $scope.message = '';
            $scope.messageHistory = {
                list: [],
                pointer: 0
            };

            $scope.connectionDetails = {
                nickname: IrcManager.nickname,
                username: IrcManager.nickname,
                password: '',
                serverHost: 'irc.freenode.net',
                serverPassword: '',
                serverPort: 6667,
                defaultChannel: '#reddcoin'
            };

            var details = settingsDb.getValue('irc.connectionDetails');
            details.then(function success (setting) {
                $timeout(function () {
                    $scope.connectionDetails = setting.value;
                });
            });

            $scope.showAdvanced = false;

            $scope.irc = IrcManager;

            $scope.scrollHistory = function (event) {
                console.log(event);
            };

            $scope.toggleAdvanced = function () {
                $scope.showAdvanced = !$scope.showAdvanced;
            };

            $scope.saveConnectionDetails = function () {
                var result =  settingsDb.setValue('irc.connectionDetails', $scope.connectionDetails);
                result.then(
                    function success (setting) {
                        $alert({
                            "title": "IRC",
                            "content": "Connection Settings Saved",
                            "type": "success"
                        });
                    },
                    function error (error) {
                        console.log(error);
                        $alert({
                            "title": "IRC",
                            "content": "Could not save connection settings",
                            "type": "danger"
                        });
                    }
                );
            };

            $scope.connect = function () {
                if (!IrcManager.isConnected()) {
                    IrcManager.connect($scope.connectionDetails);
                }
            };

            $scope.disconnect = function () {
                if (IrcManager.isConnected()) {
                    IrcManager.disconnect();
                }
            };

            $scope.sendMessage = function () {
                $scope.irc.send($scope.irc.mainChannel, $scope.message);

                $scope.message = '';
            }

        }
    ]
);