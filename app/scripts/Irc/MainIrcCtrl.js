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

            $scope.focusSendMessage = false;

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
                serverPort: 7000,
                serverSsl: true,
                defaultChannel: '#reddcoin'
            };

            var details = settingsDb.getValue('irc.connectionDetails');
            details.then(function success (setting) {
                $timeout(function () {
                    $scope.connectionDetails = setting.value;
                });
            });

            var window = require('nw.gui').Window.get();
            window.on('new-win-policy', function (frame, url, policy) {
                require('nw.gui').Shell.openExternal(url);
                policy.ignore();
            });

            $scope.showAdvanced = false;

            $scope.irc = IrcManager;

            $scope.autocomplete = function (event) {
                var userList = $scope.irc.getCurrentChannel().users;
                var currentMessage = $scope.message;
                var messageParts = properSplit(currentMessage, " ");
                var lastWord = messageParts[messageParts.length - 1];

                for (var i = 0; i < userList.length; i++) {
                    var user = userList[i];

                    if (user.indexOf("@") === 1 || user.indexOf('+') === 1) {
                        user = user.substring(1); // Cut off the start of the string
                    }

                    if (user.toLowerCase().indexOf(lastWord.toLowerCase()) === 0) {
                        messageParts[messageParts.length - 1] = user;
                        break;
                    }

                }

                $scope.message = messageParts.join(" ");
                $scope.focusSendMessage = true;
            };

            $scope.scrollHistory = function (event) {
                console.log(event);
            };

            $scope.toggleAdvanced = function () {
                $scope.showAdvanced = !$scope.showAdvanced;
            };

            $scope.switchChannel = function (channel) {
                $scope.irc.switchChannel(channel.name);
            };

            $scope.partChannel = function () {
                $scope.irc.partChannel($scope.irc.currentChannel);
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
                $scope.irc.send($scope.irc.currentChannel, $scope.message);

                $scope.message = '';
            }

        }
    ]
);