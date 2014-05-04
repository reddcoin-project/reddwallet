App.Wallet.factory('wallet',
    [
        '$q',
        '$timeout',
        '$rootScope',
        'daemonManager',
        function ($q, $timeout, $rootScope, daemonManager) {

            var client = daemonManager.getClient();

            var WalletModel = function () {

                this.info = {
                    "version": "",
                    "protocolversion": "",
                    "walletversion": "",
                    "balance": 0,
                    "blocks": 0,
                    "timeoffset": 0,
                    "connections": 0,
                    "proxy": "",
                    "difficulty": 0,
                    "testnet": false,
                    "keypoololdest": 0,
                    "keypoolsize": 0,
                    "paytxfee": 0,
                    "mininput": 0.00,
                    "errors": ""
                };

                this.accounts = [

                ];

            };

            WalletModel.prototype = {

                send: function(data) {
                    var self = this;

                    client.exec('settxfee', data.fee, function(err, info) {
                        if (info || info == 'true') {
                            client.exec('sendtoaddress', data.address, parseFloat(data.amount), data.payerComment, data.payeeComment, function(err, info) {
                                if (err == null) {
                                    console.log("Transaction Complete");
                                } else {
                                    console.log(err);
                                }
                            });
                        }
                    });

                },

                updateInfo: function() {
                    var self = this;
                    client.exec('getinfo', function (err, info) {
                        if (err == null) {
                            self.info = info;
                            $rootScope.$apply();
                        }
                    });
                },

                updateAccounts: function() {

                    var async = require('async');
                    var self = this;

                    client.exec('listaccounts', function (err, accountList) {
                        if (err == null) {

                            var accounts = [];

                            for (var key in accountList) {
                                if (!accountList.hasOwnProperty(key)) continue;

                                (function (key) {
                                    async.series(
                                        {
                                            one: function(callback) {

                                                var newAccount = {
                                                    label: key,
                                                    balance: accountList[key],
                                                    address: ''
                                                };

                                                accounts.push(newAccount);

                                                client.exec('getaccountaddress', newAccount.label, function(err, address) {
                                                    if (err != null) {
                                                        console.log(err);
                                                        callback(false);
                                                    } else {
                                                        newAccount.address = address;
                                                        callback(true);
                                                    }
                                                });

                                            }
                                        },
                                        function (err, results) {
                                            self.accounts = accounts;
                                            $rootScope.$apply();
                                        }
                                    )
                                }(key));
                            }
                        }
                    });
                },

                initialize: function() {
                    var self = this;

                    $rootScope.$on('daemon.ready', function (ready) {
                        if (ready) {
                            self.updateInfo();
                            self.updateAccounts();
                        }
                    });

                    $rootScope.$on('daemon.notifications.block', function () {
                        self.updateInfo();
                        self.updateAccounts();
                    });

                }

            };

            return new WalletModel();
        }

    ]
);