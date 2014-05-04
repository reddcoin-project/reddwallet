App.Wallet.controller(
    'SendCtrl',
    [
        '$scope',
        'daemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

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

            $scope.confirmSend = function() {
                wallet.send($scope.send);
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