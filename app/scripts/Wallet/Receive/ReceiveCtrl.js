App.Wallet.controller(
    'ReceiveCtrl',
    [
        '$scope',
        '$alert',
        '$modal',
        '$filter',
        'walletDb',
        'ngTableParams',
        function ($scope, $alert, $modal, $filter, walletDb, ngTableParams) {

            $scope.walletDb = walletDb;

            $scope.accounts = $scope.walletDb.receivingAccounts;

            $scope.tableParams = new ngTableParams({
                page: 1,
                count: 5,
                filter: { label: '' }
            }, {
                total: $scope.accounts.length,
                filterDelay: 250,
                getData: function ($defer, params) {
                    var orderedData = params.filter() ? $filter('filter')($scope.accounts, params.filter()) : data;

                    $scope.slicedData = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());

                    params.total(orderedData.length);

                    $defer.resolve($scope.slicedData);
                }
            });

            $scope.refreshAccounts = function () {
                var recAccProm = $scope.walletDb.getReceivingAccounts();
                recAccProm.then(function (accounts) {
                    $scope.accounts = accounts;
                    $scope.tableParams.reload();
                    return accounts;
                });

                return recAccProm;
            };

            $scope.refreshAccounts();

            $scope.newAddress = function () {

                var newAddress = $modal({
                    title: 'New Wallet Address',
                    content: "Please enter the name of your new address.",
                    template: 'scripts/Wallet/Receive/new-address-dialog.html',
                    show: false
                });

                newAddress.$scope.focusMe = true;
                newAddress.$scope.addressLabel = '';
                newAddress.$scope.confirm = function (addressLabel) {
                    var promise = walletDb.newAddress(addressLabel);
                    promise.then(
                        function success(message) {
                            $scope.refreshAccounts();
                            $alert({
                                "title": "New Address",
                                "content": "Created",
                                "type": "success"
                            });

                            return message;
                        },
                        function error(message) {
                            var errorMessage = message.rpcError.code == -14 ? "Incorrect passphrase." : "Failed";

                            $alert({
                                "title": "New Address",
                                "content": errorMessage,
                                "type": "warning"
                            });

                            return message;
                        }
                    );
                };

                newAddress.$promise.then(newAddress.show);

            };

            $scope.editAddress = function (account) {
                var self = this;

                var oldLabel = account.label;

                var editAddress = $modal({
                    title: 'Modify Address Label',
                    content: "Please enter the new label of your address.",
                    template: 'scripts/Wallet/Receive/edit-address-dialog.html',
                    show: false
                });

                editAddress.$scope.focusMe = true;
                editAddress.$scope.addressLabel = oldLabel;
                editAddress.$scope.confirm = function (addressLabel) {

                    var promise = self.walletDb.updateAccount(account, {label: addressLabel});

                    function error(message) {
                        $alert({
                            "title": "Modify Address",
                            "content": "Failed",
                            "type": "warning"
                        });
                    }

                    promise.then(
                        function success(message) {
                            if (message.dbReplaced > 0) {
                                $scope.refreshAccounts();
                                $alert({
                                    "title": "Modify Address",
                                    "content": "Success",
                                    "type": "success"
                                });
                            } else {
                                error(message);
                            }
                        },
                        error
                    );


                };

                editAddress.$promise.then(editAddress.show);

            };

            $scope.copy = function (account) {

                // Load native UI library
                var gui = require('nw.gui');

                // We can not create a clipboard, we have to receive the system clipboard
                var clipboard = gui.Clipboard.get();

                // Set the address..
                clipboard.set(account.address);

                $alert({
                    "title": "Copied " + account.label,
                    "content": account.address,
                    "type": "info",
                    duration: 1.5
                });

            };

        }
    ]
);