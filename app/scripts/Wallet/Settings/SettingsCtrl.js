App.Wallet.controller(
    'SettingsCtrl',
    [
        '$scope',
        '$alert',
        '$modal',
        '$timeout',
        'walletDb',
        'fileDialog',
        'DaemonManager',
        function ($scope, $alert, $modal, $timeout, walletDb, fileDialog, DaemonManager) {

            $scope.walletDb = walletDb;
            $scope.walletOverview = walletDb.overviewModel;

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
                            title: "Change Failed",
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
                                content: "Complete, now restarting daemon",
                                type: "success",
                                duration: 7
                            });
                            $timeout(function() {
                                DaemonManager.killDaemon();
                                DaemonManager.initialize();
                                DaemonManager.getBootstrap().startLocal();
                            });
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

            $scope.lockWallet = function () {
                var promise = walletDb.getRpc().lockWallet();
                promise.then(
                    function success(message) {
                        $timeout(function( ) {
                            $scope.walletDb.overviewModel.locked = true;
                            $scope.walletOverview.locked = true;
                        });
                        $alert({
                            title: "Lock Wallet",
                            content: "Successful",
                            type: "success",
                            duration: 2
                        });
                    },
                    function error(message) {
                        $alert({
                            title: "Lock Wallet",
                            content: "An error occurred",
                            type: "warning"
                        });
                    }
                );
            };

            $scope.unlockWallet = function() {

                var modal = $modal({
                    title: 'Unlock Wallet',
                    content: "Unlock your wallet only for staking, this will prevent unauthorized transactions from occurring. " +
                    "Alternatively unlock it fully if you have a lot of transactions to process.",
                    template: 'scripts/Wallet/Settings/unlock-wallet-dialog.html',
                    show: false
                });

                modal.$scope.passphrase = '';
                modal.$scope.stakingOnly = true;
                modal.$scope.unlock = function(passphrase) {

                    if (passphrase == '' || passphrase == null) {
                        $alert({
                            title: "Unlock Failed",
                            content: "You cannot have a blank passphrase",
                            type: "warning"
                        });
                        return;
                    }

                    var promise = walletDb.getRpc().unlockWallet(passphrase, $scope.stakingOnly);
                    promise.then(
                        function success(message) {
                            $timeout(function( ) {
                                $scope.walletDb.overviewModel.locked = false;
                                $scope.walletOverview.locked = false;
                            });

                            $alert({
                                title: "Unlock Wallet",
                                content: "Successful",
                                type: "success",
                                duration: 2
                            });
                        },
                        function error(message) {
                            $alert({
                                title: "Unlock Wallet",
                                content: "Incorrect passphrase",
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