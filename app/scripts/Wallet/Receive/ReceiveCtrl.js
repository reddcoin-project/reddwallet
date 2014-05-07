App.Wallet.controller(
    'ReceiveCtrl',
    [
        '$scope',
        '$alert',
        '$modal',
        'wallet',
        function ($scope, $alert, $modal, wallet) {

            $scope.wallet = wallet;

            $scope.newAddress = function () {

                var newAddress = $modal({
                    title: 'New Wallet Address',
                    content: "Please enter the name of your new address.",
                    template: 'scripts/Wallet/Receive/new-address-dialog.html',
                    show: false
                });

                newAddress.$scope.focusMe = true;
                newAddress.$scope.addressLabel = '';
                newAddress.$scope.confirm = function(addressLabel) {
                    var promise = wallet.newAddress(addressLabel);
                    promise.then(
                        function success(message) {
                            $alert({
                                "title": "New Address",
                                "content": "Created",
                                "type": "success"
                            });
                        },
                        function error(message) {
                            var errorMessage = message.rpcError.code == -14 ? "Incorrect passphrase." : "Failed";

                            $alert({
                                "title": "New Address",
                                "content": errorMessage,
                                "type": "warning"
                            });
                        }
                    );
                };

                newAddress.$promise.then(newAddress.show);

            };

            $scope.copy = function ($index) {

                // Load native UI library
                var gui = require('nw.gui');

                // We can not create a clipboard, we have to receive the system clipboard
                var clipboard = gui.Clipboard.get();

                var account = $scope.wallet.accounts[$index];

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