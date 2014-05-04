App.Wallet.controller(
    'ReceiveCtrl',
    [
        '$scope',
        'DaemonManager',
        'wallet',
        function ($scope, daemon, wallet) {

            $scope.wallet = wallet;

            $scope.copy = function ($index) {

                // Load native UI library
                var gui = require('nw.gui');

                // We can not create a clipboard, we have to receive the system clipboard
                var clipboard = gui.Clipboard.get();

                // Set the address..
                clipboard.set($scope.wallet.accounts[$index].address);

            };

        }
    ]
);