App.Wallet.controller(
    'StatisticsCtrl',
    [
        '$scope',
        '$rootScope',
        '$timeout',
        '$alert',
        'walletDb',
        function ($scope, $rootScope, $timeout, $alert, walletDb) {

            $scope.overview = walletDb.overviewModel;
            $scope.staking = walletDb.stakingInfoModel;

        }
    ]
);