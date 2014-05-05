App.Wallet.controller(
    'SendCtrl',
    [
        '$scope',
        '$alert',
        'DaemonManager',
        'wallet',
        function ($scope, $alert, daemon, wallet) {

            $scope.wallet = wallet;

            $scope.send = {
                amount: 1,
                address: 'Rer7K4AwRhUYshzzPeamRkC9cV7M6BSz3P',
                payerComment: '',
                payeeComment: '',
                fee: 0.001
            };

            $scope.meta = {
                totalAmount: 0
            };

            /**
             * @todo: Actually build in a confirmation box.. maybe validate properly when sent has been hit/disable send
             */
            $scope.confirmSend = function() {
                wallet.send($scope.send, function(message) {
                    if (message.result) {
                        $alert({
                            "title": "Sent " + $scope.send.amount + " RDD ",
                            "content": "to " + $scope.send.address,
                            "type": "success"
                        });
                    } else {
                        $alert({
                            "title": "Error",
                            "content": $scope.send.amount,
                            "type": "warning"
                        });
                    }
                });
            };

            $scope.updateMetaTotal = function() {
                var result = parseFloat($scope.send.amount) + parseFloat($scope.send.fee);
                if (result == null || result == undefined || isNaN(result)) {
                    result = "Invalid Amount";
                }

                $scope.meta.totalAmount = result;
            };

            $scope.updateMetaTotal();

        }
    ]
);