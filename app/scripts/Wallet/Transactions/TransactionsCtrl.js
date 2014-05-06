App.Wallet.controller(
    'TransactionsCtrl',
    [
        '$scope',
        '$aside',
        'wallet',
        function($scope, $aside, wallet) {

            $scope.transactions = {};

            wallet.getTransactions().then(function(message, data) {
                $scope.transactions = message.rpcInfo;
            });

            $scope.viewTransaction = function($index) {

                var trans = formatTransaction($scope.transactions[$index]);

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
                    }
                };
                for (var key in transaction) {
                    if (!transaction.hasOwnProperty(key)) {
                        continue;
                    }

                    var value = transaction[key];
                    if (transform[key] != undefined) {
                        value = transform[key](value);
                    }

                    formatted[key.toTitleCase()] = value;
                }

                return formatted;
            }

            return $scope;
        }
    ]
);