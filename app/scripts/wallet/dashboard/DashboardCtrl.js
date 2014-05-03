App.Wallet.controller(
    'DashboardCtrl',
    [
        '$scope',
        'daemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

            $scope.wallet = wallet;



        }
    ]
);