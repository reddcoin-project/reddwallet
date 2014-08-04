App.Wallet.controller(
    'SendCtrl',
    [
        '$q',
        '$scope',
        '$alert',
        '$modal',
        'walletDb',
        'DaemonManager',
        function ($q, $scope, $alert, $modal, walletDb, daemon) {

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

            $scope.reset = function () {
                $scope.send = {
                    amount: 1,
                    address: '',
                    payerComment: '',
                    payeeComment: '',
                    fee: 0.1
                };
                $scope.updateMetaTotal();
            };

            $scope.confirmSend = function () {

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

                confirm.$scope.confirm = function () {

                    var fee = $scope.walletDb.calculateFee(sendClone.amount);

                    var transactionFeePromise = walletDb.getRpc().setTxFee(fee);

                    transactionFeePromise.then(
                        function success (message) {
                            var promise = walletDb.getRpc().send(sendClone);
                            promise.then(
                                function success(message) {
                                    $alert({
                                        "title": "Sent " + sendClone.amount + " RDD ",
                                        "content": "to " + sendClone.address,
                                        "type": "success"
                                    });
                                    $scope.reset();
                                    $scope.walletDb.updateOverview();
                                },
                                function error(message) {
                                    var errorMessage = message.message;

                                    $alert({
                                        "title": "Sending Failed",
                                        "content": errorMessage,
                                        "type": "warning"
                                    });
                                }
                            );
                        },
                        function error (message) {
                            $alert({
                                "title": "Sending Failed",
                                "content": message.message,
                                "type": "warning"
                            });
                        }
                    );

                };

                confirm.$promise.then(confirm.show);
            };

            $scope.updateMetaTotal = function () {

                if ($scope.send.address == '') {
                    $scope.disableSend = true;

                    return;
                }

                var result = parseFloat($scope.send.amount);
                if (result == null || isNaN(result)) {
                    result = 0;
                    $scope.disableSend = true;
                } else {
                    $scope.disableSend = false;
                    result = result + $scope.walletDb.calculateFee(result);
                }

                $scope.disableSend = result >= parseFloat($scope.walletDb.overviewModel.balance);

                $scope.meta.totalAmount = result;
                $scope.meta.fee = $scope.walletDb.calculateFee(result);
            };

            $scope.reset();

        }
    ]
);