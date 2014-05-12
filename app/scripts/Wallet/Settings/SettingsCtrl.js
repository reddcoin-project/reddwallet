App.Wallet.controller(
    'SettingsCtrl',
    [
        '$scope',
        '$alert',
        '$modal',
        'walletDb',
        'fileDialog',
        function ($scope, $alert, $modal, walletDb, fileDialog) {

            $scope.walletDb = walletDb;

            $scope.isEncrypted = walletDb.getRpc().isEncrypted;

            $scope.changePassphrase = function() {

                var modal = $modal({
                    title: 'Change Passphrase',
                    content: "Please enter a new passphrase for your wallet.",
                    template: 'scripts/Wallet/Settings/change-passphrase-dialog.html',
                    show: false
                });

                modal.$scope.oldPassphrase = '';
                modal.$scope.newPassphrase = '';
                modal.$scope.confirmPassphrase = '';
                modal.$scope.confirm = function(oldPassphrase, newPassphrase) {

                    if (newPassphrase == '' || newPassphrase == null) {
                        $alert({
                            title: "Encryption Failed",
                            content: "You cannot have a blank passphrase",
                            type: "warning"
                        });
                        return;
                    }

                    var promise = walletDb.getRpc().changePassphrase(oldPassphrase, newPassphrase);
                    promise.then(
                        function success(message) {
                            $alert({
                                title: "Passphrase Change",
                                content: "Successful",
                                type: "success"
                            });
                        },
                        function error(message) {
                            var errorMessage = "Failed";
                            if (message.rpcError.code == -14) {
                                errorMessage = "Incorrect passphrase."
                            }
                            $alert({
                                title: "Passphrase Change",
                                content: errorMessage,
                                type: "warning"
                            });
                        }
                    );
                };

                modal.$promise.then(modal.show);

            };

            $scope.encryptWallet = function() {

                var modal = $modal({
                    title: 'Encrypt Wallet',
                    content: "Please enter a passphrase for your wallet, if you lose this you will not be able to recover your coins. Keep it safe!",
                    template: 'scripts/Wallet/Settings/encrypt-wallet-dialog.html',
                    show: false
                });

                modal.$scope.passphrase = '';
                modal.$scope.confirmPassphrase = '';
                modal.$scope.confirm = function(passphrase) {

                    if (passphrase == '' || passphrase == null) {
                        $alert({
                            title: "Encryption Failed",
                            content: "You cannot have a blank passphrase",
                            type: "warning"
                        });
                        return;
                    }

                    var promise = walletDb.getRpc().encryptWallet(passphrase);
                    promise.then(
                        function success(message) {
                            $alert({
                                title: "Wallet Encryption",
                                content: "Success! You will need to restart.",
                                type: "success",
                                duration: 7
                            });
                            var gui = require('nw.gui').App.Window.get();
                            gui.reload(3);
                        },
                        function error(message) {
                            $alert({
                                title: "Wallet Encryption",
                                content: "Failed",
                                type: "danger"
                            });
                        }
                    );
                };

                modal.$promise.then(modal.show);

            };

            $scope.backupWallet = function() {
                fileDialog.saveAs(function(filename) {

                    var promise = walletDb.getRpc().backupWallet(filename);
                    promise.then(
                        function success(message) {
                            $alert({
                                title: "Backup Wallet",
                                content: "Successful",
                                type: "success",
                                duration: 3
                            });
                        },
                        function error(message) {
                            $alert({
                                title: "Backup Wallet",
                                content: "Failed",
                                type: "warning",
                                duration: 3
                            });
                        }
                    );

                }, 'wallet-backup.dat');
            };

        }
    ]
);