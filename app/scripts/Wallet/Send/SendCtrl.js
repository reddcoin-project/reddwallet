App.Wallet.controller(
    'SendCtrl',
    [
        '$q',
        '$scope',
        '$alert',
        '$modal',
        'DaemonManager',
        'walletDb',
        function ($q, $scope, $alert, $modal, daemon, walletDb) {

            $scope.walletDb = walletDb;
            $scope.disableSend = true;
            $scope.meta = {
                totalAmount: 0
            };

            $scope.accounts = $scope.walletDb.sendingAccounts;
            $scope.refreshAccounts = function () {
                var recAccProm = $scope.walletDb.getSendingAccounts();
                recAccProm.then(function (accounts) {
                    $scope.accounts = accounts;
                    return accounts;
                });

                return recAccProm;
            };
            $scope.refreshAccounts();

            $scope.reset = function() {
                $scope.send = {
                    amount: 1,
                    address: '',
                    payerComment: '',
                    payeeComment: '',
                    fee: parseFloat(daemon.getBootstrap().daemonConfig.paytxfee)
                };
                $scope.updateMetaTotal();
            };

            $scope.confirmSend = function() {

                var sendClone = _.clone($scope.send);

                if (_.isObject(sendClone.address)) {
                    sendClone.address = $scope.send.address.address;
                }

                var confirm = $modal({
                    title: 'Confirm Send',
                    content: "Please confirm that you want to send the amount of <strong>" + sendClone.amount + " RDD</strong> " +
                             "to the address <strong>" + sendClone.address + "</strong>.",
                    template: 'scripts/Wallet/Core/confirm-dialog.html',
                    show: false
                });

                confirm.$scope.confirm = function() {
                    var promise = walletDb.getRpc().send(sendClone);
                    promise.then(
                        function success (message) {
                            $alert({
                                "title": "Sent " + sendClone.amount + " RDD ",
                                "content": "to " + sendClone.address,
                                "type": "success"
                            });
                            $scope.reset();
                            $scope.walletDb.updateOverview();
                        },
                        function error (message) {
                            var errorMessage = message.message;

                            $alert({
                                "title": "Sending Failed",
                                "content": errorMessage,
                                "type": "warning"
                            });
                        }
                    );
                };

                confirm.$promise.then(confirm.show);
            };

            $scope.updateMetaTotal = function() {
                var result = parseFloat($scope.send.amount) + parseFloat($scope.send.fee);
                if (result == null || isNaN(result) || $scope.send.address == '') {
                    result = "";
                    $scope.disableSend = true;
                } else {
                    $scope.disableSend = false;
                }

                $scope.disableSend = result > $scope.walletDb.overviewModel.balance;

                $scope.meta.totalAmount = result;
            };

            $scope.reset();

        }
    ]
);