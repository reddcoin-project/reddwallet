App.Wallet.controller(
    'SendCtrl',
    [
        '$scope',
        'daemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

            $scope.wallet = wallet;
            $scope.send = {
                amount: 0,
                address: 'Rer7K4AwRhUYshzzPeamRkC9cV7M6BSz3P',
                payerComment: '',
                payeeComment: '',
                fee: 0.001
            };

            $scope.confirmSend = function() {

                wallet.send($scope.send);

            };

        }
    ]
);