App.Wallet.controller(
    'TransactionsCtrl',
    [
        '$scope',
        '$aside',
        '$filter',
        'walletDb',
        'ngTableParams',
        function($scope, $aside, $filter, walletDb, ngTableParams) {

            $scope.transactions = [];

            $scope.tableParams = new ngTableParams({
                page: 1,
                count: 5,
                sorting: {
                    time: 'desc'
                }
            }, {
                total: $scope.transactions.length,
                filterDelay: 250,
                getData: function ($defer, params) {

                    // use build-in angular filter
                    var orderedData = params.sorting() ? $filter('orderBy')($scope.transactions, params.orderBy()) : $scope.transactions;

                    $scope.slicedData = orderedData.slice(
                        (params.page() - 1) * params.count(),
                        params.page() * params.count()
                    );

                    params.total($scope.slicedData.length);
                    $defer.resolve($scope.slicedData);
                }
            });

            $scope.refreshTransactions = function () {
                walletDb.getTransactions().then(function(message) {
                    $scope.transactions = message.rpcInfo;

                    for (var i = 0; i < $scope.transactions.length; i++) {
                        $scope.transactions[i].time = parseInt($scope.transactions[i].time);
                        $scope.transactions[i].amount = parseFloat($scope.transactions[i].amount);
                    }

                    $scope.tableParams.reload();
                });
            };

            $scope.refreshTransactions();





            $scope.viewTransaction = function(rawTrans) {

                var trans = formatTransaction(rawTrans);

                var aside = $aside({
                    show: false,
                    title: 'Transaction Details',
                    template: 'scripts/Wallet/Transactions/view-transaction.html',
                    contentTemplate: 'scripts/Wallet/Transactions/details-partial.html'
                });

                aside.$scope.trans = trans;
                aside.$promise.then(aside.show);

            };

            function formatTransaction(transaction) {
                var formatted = {};
                var transform = {
                    'time': function (value) {
                        var date = new Date(parseFloat(value) * 1000);

                        return date.toUTCString();
                    },
                    'timereceived': function (value) {
                        var date = new Date(parseFloat(value) * 1000);

                        return date.toUTCString();
                    },
                    'txid': function (value, formatted) {
                        formatted.txidTrim = smartTrim(value, 20);

                        return value;
                    },
                    'blockhash': function (value, formatted) {
                        formatted.blockhashTrim = smartTrim(value, 20);

                        return value;
                    },
                    'address': function (value) {
                        return value;
                    }
                };
                for (var key in transaction) {
                    if (!transaction.hasOwnProperty(key)) {
                        continue;
                    }

                    var value = transaction[key];
                    if (transform[key] != undefined) {
                        value = transform[key](value, formatted);
                    }

                    formatted[key] = value;
                }

                return formatted;
            }


        }
    ]
);