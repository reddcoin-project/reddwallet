App.Wallet.controller(
    'ReceiveCtrl',
    [
        '$scope',
        'daemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

            $scope.wallet = wallet;



        }
    ]
);