App.Wallet.controller(
    'SettingsCtrl',
    [
        '$scope',
        '$alert',
        'wallet',
        'fileDialog',
        function ($scope, $alert, wallet, fileDialog) {

            $scope.wallet = wallet;

            $scope.backupWallet = function() {
                fileDialog.saveAs(function(filename) {

                    wallet.backupWallet(filename, function(message) {
                        if (message.result) {
                            $alert({
                                "title": message.message,
                                "content": "",
                                "type": "success",
                                duration: 3
                            });
                        } else {
                            $alert({
                                "title": message.message,
                                "content": "",
                                "type": "warning",
                                duration: 3
                            });
                        }
                    });

                }, 'wallet-backup.dat');
            };

        }
    ]
);