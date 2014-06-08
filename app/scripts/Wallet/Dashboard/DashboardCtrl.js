App.Wallet.controller(
    'DashboardCtrl',
    [
        '$scope',
        '$timeout',
        '$alert',
        'walletDb',
        function ($scope, $timeout, $alert, walletDb) {

            $scope.walletOverview = $scope.walletDb.overviewModel;

        }
    ]
);