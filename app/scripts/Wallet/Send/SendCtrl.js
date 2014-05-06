App.Wallet.controller(
    'SendCtrl',
    [
        '$q',
        '$scope',
        '$alert',
        '$modal',
        'DaemonManager',
        'wallet',
        function ($q, $scope, $alert, $modal, daemon, wallet) {

            $scope.wallet = wallet;
            $scope.disableSend = true;
            $scope.meta = {
                totalAmount: 0
            };

            $scope.reset = function() {
                $scope.send = {
                    amount: 1,
                    address: 'Rer7K4AwRhUYshzzPeamRkC9cV7M6BSz3P',
                    payerComment: '',
                    payeeComment: '',
                    fee: parseFloat(daemon.getBootstrap().daemonConfig.paytxfee)
                };
                $scope.updateMetaTotal();
            };

            /**
             * @todo: Actually build in a confirmation box.. maybe validate properly when sent has been hit/disable send
             */
            $scope.confirmSend = function() {

                var confirm = $modal({
                    title: 'Confirm Send',
                    content: "Please confirm that you want to send the amount of <strong>" + $scope.send.amount + " RDD</strong> " +
                             "to the address <strong>" + $scope.send.address + "</strong>.",
                    template: 'scripts/Wallet/Core/confirm-dialog.html',
                    show: false
                });

                confirm.$scope.confirm = function() {
                    var promise = wallet.send($scope.send);
                    promise.then(
                        function success(message) {
                            $alert({
                                "title": "Sent " + $scope.send.amount + " RDD ",
                                "content": "to " + $scope.send.address,
                                "type": "success"
                            });
                            $scope.reset();
                        },
                        function error(message) {
                            var errorMessage = "Please double check the amount & address";
                            if (message.rpcError.code == -14) {
                                errorMessage = "Incorrect passphrase."
                            }

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

                $scope.disableSend = result > $scope.wallet.info.balance;

                $scope.meta.totalAmount = result;
            };

            $scope.reset();

        }
    ]
);