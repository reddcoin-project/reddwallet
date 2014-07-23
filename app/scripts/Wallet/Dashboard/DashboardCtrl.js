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

            $scope.cryptsy =  ExchangeManager.getExchange('cryptsy');
            $scope.coinbase =  ExchangeManager.getExchange('coinbase');

            $scope.walletOverview = $scope.walletDb.overviewModel;
            $scope.marketData = {
                btc:    "Loading...",
                rddBtc: "Loading...",
                rddLtc: "Loading..."
            };

            $scope.loadMarketData = function () {
                try {

                    if ($scope.coinbase.currencyRates['btc_to_usd'] != undefined) {
                        $scope.marketData.btc = $scope.coinbase.currencyRates['btc_to_usd'];
                    } else {
                        $scope.coinbase.loadCurrencyRates();
                    }

                    $rootScope.$on('exchanges.coinbase.currencyRates', function (event, rates) {
                        $scope.marketData.btc = rates['btc_to_usd'];
                    });

                    if (Object.keys($scope.cryptsy.marketData).length > 0) {
                            $scope.marketData.rddBtc = $scope.cryptsy.marketData['RDD:169'].lasttradeprice;
                            $scope.marketData.rddLtc = $scope.cryptsy.marketData['RDD:212'].lasttradeprice;
                    } else {
                        $scope.cryptsy.loadDefaultMarkets();
                    }

                } catch (error) {
                    console.log(error);
                }
            };

            $rootScope.$on('exchanges.cryptsy.marketData', function (event, data) {
                try {
                    if (data.marketId == 169) {
                        $scope.marketData.rddBtc = $scope.cryptsy.marketData['RDD:169'].lasttradeprice;
                    } else if (data.marketId == 212) {
                        $scope.marketData.rddLtc = $scope.cryptsy.marketData['RDD:212'].lasttradeprice;
                    }
                } catch (error) {
                    console.log(error);
                }
            });

            $scope.loadMarketData();

        }
    ]
);