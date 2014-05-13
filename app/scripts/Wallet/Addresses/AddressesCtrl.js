App.Wallet.controller(
    'AddressesCtrl',
    [
        '$scope',
        '$alert',
        '$modal',
        '$filter',
        'walletDb',
        'ngTableParams',
        function ($scope, $alert, $modal, $filter, walletDb, ngTableParams) {

            $scope.walletDb = walletDb;

            $scope.accounts = $scope.walletDb.sendingAccounts;

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
                var recAccProm = $scope.walletDb.getSendingAccounts();
                recAccProm.then(function (accounts) {
                    $scope.accounts = accounts;
                    $scope.tableParams.parameters({
                        page: 1,
                        count: 5,
                        filter: { label: '' }
                    });
                    $scope.tableParams.reload();
                    return accounts;
                });

                return recAccProm;
            };

            $scope.refreshAccounts();

            $scope.newAddress = function () {

                var newAddress = $modal({
                    title: 'New Wallet Contact',
                    content: "Please enter the name & address of your new contact.",
                    template: 'scripts/Wallet/Addresses/new-contact-dialog.html',
                    show: false
                });

                newAddress.$scope.focusMe = true;
                newAddress.$scope.label = '';
                newAddress.$scope.address = '';
                newAddress.$scope.confirm = function (label, address) {
                    var promise = walletDb.newContact(label, address);
                    promise.then(
                        function success(message) {
                            $scope.refreshAccounts();
                            $alert({
                                "title": "New Contact",
                                "content": "Created",
                                "type": "success"
                            });

                            return message;
                        },
                        function error(message) {
                            var errorMessage = message.rpcError.code == -14 ? "Incorrect passphrase." : "Failed";

                            $alert({
                                "title": "New Contact",
                                "content": errorMessage,
                                "type": "warning"
                            });

                            return message;
                        }
                    );
                };

                newAddress.$promise.then(newAddress.show);

            };

            $scope.deleteAddress = function (account) {
                var self = this;
                var editAddress = $modal({
                    title: 'Delete Contact',
                    content: "Are you sure you want to delete this contact?",
                    template: 'scripts/Wallet/Core/confirm-dialog.html',
                    show: false
                });

                editAddress.$scope.confirm = function () {
                    var promise = self.walletDb.deleteAccount(account);

                    function error(message) {
                        $alert({
                            "title": "Delete Contact",
                            "content": "Failed",
                            "type": "warning"
                        });
                    }

                    promise.then(
                        function success(message) {
                            if (message.dbReplaced > 0) {
                                $scope.refreshAccounts();
                                $alert({
                                    "title": "Delete Contact",
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
            },

            $scope.editAddress = function (account) {
                var self = this;

                var oldLabel = account.label;
                var oldAddress = account.address;

                var editAddress = $modal({
                    title: 'Modify Contact',
                    content: "Please enter the new label of your address.",
                    template: 'scripts/Wallet/Addresses/edit-contact-dialog.html',
                    show: false
                });

                editAddress.$scope.focusMe = true;
                editAddress.$scope.label = oldLabel;
                editAddress.$scope.address = oldAddress;
                editAddress.$scope.confirm = function (label, address) {

                    var promise = self.walletDb.updateAccount(account, {label: label, name: label, address: address});

                    function error(message) {
                        $alert({
                            "title": "Modify Contact",
                            "content": "Failed",
                            "type": "warning"
                        });
                    }

                    promise.then(
                        function success(message) {
                            if (message.dbReplaced > 0) {
                                $scope.refreshAccounts();
                                $alert({
                                    "title": "Modify Contact",
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