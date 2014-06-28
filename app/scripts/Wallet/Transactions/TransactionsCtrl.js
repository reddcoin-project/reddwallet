App.Wallet.controller(
    'TransactionsCtrl',
    [
        '$scope',
        '$rootScope',
        '$aside',
        '$filter',
        '$timeout',
        '$alert',
        'walletDb',
        'ngTableParams',
        function($scope, $rootScope, $aside, $filter, $timeout, $alert, walletDb, ngTableParams) {

            $scope.transactions = $scope.walletDb.transactions;

            $scope.refreshTransactions = function () {
                $timeout(function() {
                    $scope.transactions = walletDb.transactions;
                    $scope.tableParams.reload();
                });
            };

            $scope.refreshTransactions();

            $rootScope.$on('daemon.notifications.block', $scope.refreshTransactions);

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
                    var orderedData = params.sorting() ? $filter('orderBy')($scope.transactions, params.orderBy()) : $scope.transactions;
                    params.total(orderedData.length);

                    if (orderedData.length == 0) {
                        $scope.slicedData = orderedData;
                        $defer.resolve(orderedData);
                    }

                    $scope.slicedData = orderedData.slice(
                        (params.page() - 1) * params.count(),
                        params.page() * params.count()
                    );

                    $defer.resolve($scope.slicedData);
                }
            });

            $scope.viewTransaction = function(rawTrans) {

                var trans = formatTransaction(rawTrans);

                var aside = $aside({
                    show: false,
                    title: 'Transaction Details',
                    template: 'scripts/Wallet/Transactions/view-transaction.html',
                    contentTemplate: 'scripts/Wallet/Transactions/details-partial.html'
                });

                aside.$scope.copy = function (toCopy) {
                    // Load native UI library
                    var gui = require('nw.gui');

                    // We can not create a clipboard, we have to receive the system clipboard
                    var clipboard = gui.Clipboard.get();

                    // Set the address..
                    clipboard.set(toCopy);

                    $alert({
                        "title": "Copied ",
                        "content": toCopy,
                        "type": "info",
                        duration: 1.5
                    });
                };

                aside.$scope.viewTxOnline = function (transaction) {
                    var url = "http://bitinfocharts.com/reddcoin/tx/" + transaction.txid;
                    require('nw.gui').Shell.openExternal(url);
                };

                aside.$scope.viewAddressOnline = function (transaction) {
                    var url = "http://bitinfocharts.com/reddcoin/address/" + transaction.address;
                    require('nw.gui').Shell.openExternal(url);
                };

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