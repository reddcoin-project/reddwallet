App.Wallet.factory('wallet',
    [
        '$q',
        '$timeout',
        '$rootScope',
        'DaemonManager',
        function ($q, $timeout, $rootScope, DaemonManager) {

            var WalletModel = function () {

                this.client = null;
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

                var self = this;
                DaemonManager.getBootstrap().getPromise().then(function(message) {
                    if (message.result) {
                        var config = DaemonManager.getBootstrap().daemonConfig;
                        self.client = require('node-reddcoin')({
                            port: config.rpcport,
                            user: config.rpcuser,
                            pass: config.rpcpassword
                        });
                        self.initialize();
                    }

                    return message;
                });

            };

            WalletModel.prototype = {

                getTransactions: function() {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('listtransactions', function (err, info) {
                        var message;
                        if (err != null) {
                            message = new App.Global.Message(false, 3, 'Error', {
                                rpcError: err,
                                rpcInfo: info
                            });
                            deferred.reject(message);
                        } else {
                            message = new App.Global.Message(true, 0, 'Fetched Transactions', {
                                rpcError: err,
                                rpcInfo: info
                            });
                            deferred.resolve(message);
                        }
                    });

                    return deferred.promise;
                },

                lockWallet: function(callback) {
                    // commadn is walletlock  error: {"code":-15,"message":"Error: running with an unencrypted wallet, but walletlock was called."}
                },

                send: function(data, callback) {
                    var self = this;

                    this.client.exec('settxfee', data.fee, function(err, info) {
                        if (info || info == 'true') {
                            self.client.exec('sendtoaddress', data.address, parseFloat(data.amount), data.payerComment, data.payeeComment, function(err, info) {
                                var message;
                                if (err == null) {
                                    message = new App.Global.Message(true, 0, 'Transaction Complete', {
                                        rpcError: err,
                                        rpcInfo: info
                                    });
                                } else {
                                    message = new App.Global.Message(false, 3, 'Error', {
                                        rpcError: err,
                                        rpcInfo: info
                                    });
                                }

                                typeof callback === 'function' && callback(message);
                            });
                        }
                    });

                },

                backupWallet: function(filename, callback) {
                    this.client.exec('backupwallet', filename, function(err, info) {
                        var message;
                        if (err == null) {
                            message = new App.Global.Message(true, 0, 'Backup Successful', {
                                rpcError: err,
                                rpcInfo: info
                            });
                        } else {
                            message = new App.Global.Message(false, -1, 'Could not backup wallet', {
                                rpcError: err,
                                rpcInfo: info
                            });
                        }

                        typeof callback === 'function' && callback(message);
                    });
                },

                updateInfo: function() {
                    var self = this;
                    this.client.exec('getinfo', function (err, info) {
                        if (err == null) {
                            self.info = info;
                            $rootScope.$apply();
                        } else {
                            console.log(err);
                        }
                    });
                },

                updateAccounts: function() {

                    var async = require('async');
                    var self = this;

                    this.client.exec('listaccounts', function (err, accountList) {
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

                                                self.client.exec('getaccountaddress', newAccount.label, function(err, address) {
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

                    self.updateInfo();
                    self.updateAccounts();

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