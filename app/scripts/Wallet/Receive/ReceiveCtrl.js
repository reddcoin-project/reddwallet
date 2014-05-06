App.Wallet.controller(
    'ReceiveCtrl',
    [
        '$scope',
        '$alert',
        'DaemonManager',
        'wallet',
        function ($scope, $alert, daemon, wallet) {

            $scope.wallet = wallet;

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