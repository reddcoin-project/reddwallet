App.Wallet.controller(
    'DashboardCtrl',
    [
        '$scope',
        'DaemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

            $scope.wallet = wallet;



        }
    ]
);