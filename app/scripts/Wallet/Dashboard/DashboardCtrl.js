App.Wallet.controller(
    'DashboardCtrl',
    [
        '$scope',
        '$rootScope',
        '$timeout',
        '$alert',
        'walletDb',
        'ExchangeManager',
        function ($scope, $rootScope, $timeout, $alert, walletDb, ExchangeManager) {

            $scope.walletOverview = $scope.walletDb.overviewModel;

            $scope.testData = 'test ad ad awdaw d awd awd awdw http://www.google.com';

            $scope.marketData = {
                btc:    "Loading...",
                rddBtc: "Loading...",
                rddLtc: "Loading..."
            };

            var coinbase =  ExchangeManager.getExchange('coinbase');

            if (coinbase.currencyRates['btc_to_usd'] != undefined) {
                $scope.marketData.btc = coinbase.currencyRates['btc_to_usd'];
            } else {
                coinbase.loadCurrencyRates();
            }

            $rootScope.$on('exchanges.coinbase.currencyRates', function (event, rates) {
                $scope.marketData.btc = rates['btc_to_usd'];
            });

            var cryptsy =  ExchangeManager.getExchange('cryptsy');

            if (Object.keys(cryptsy.marketData).length > 0) {
                $scope.marketData.rddBtc = cryptsy.marketData['RDD:169'].lasttradeprice;
                $scope.marketData.rddLtc = cryptsy.marketData['RDD:212'].lasttradeprice;
            } else {
                cryptsy.loadDefaultMarkets();
            }

            $rootScope.$on('exchanges.cryptsy.marketData', function (event, data) {
                if (data.marketId == 169) {
                    $scope.marketData.rddBtc = cryptsy.marketData['RDD:169'].lasttradeprice;
                } else if (data.marketId == 212) {
                    $scope.marketData.rddLtc = cryptsy.marketData['RDD:212'].lasttradeprice;
                }
            });

        }
    ]
);