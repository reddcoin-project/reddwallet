App.Wallet.factory('walletRpc',
    [
        '$q',
        '$modal',
        '$timeout',
        '$rootScope',
        'DaemonManager',
        function ($q, $modal, $timeout, $rootScope, DaemonManager) {

            var WalletModel = function () {

                this.client = null;
                this.isEncrypted = false;

                var self = this;
                DaemonManager.getBootstrap().getPromise().then(function (message) {
                    if (message.result) {
                        var config = DaemonManager.getBootstrap().daemonConfig;
                        self.client = require('node-reddcoin')({
                            port: config.rpcport,
                            user: config.rpcuser,
                            pass: config.rpcpassword,
                            passphrasecallback: self.handlePassPhraseCallback
                        });

                        self.updateWalletLock();
                    }

                    return message;
                });

            };

            WalletModel.prototype = {

                rpcToMessage: function (deferred, err, info, options) {
                    var message;
                    if (err == null) {
                        message = new App.Global.Message(true, 0, '', {
                            rpcError: err,
                            rpcInfo: info
                        });

                        if (options !== undefined) {
                            if (Object.prototype.toString.call(options.update) === '[object Array]') {
                                for (var i = 0; i < options.update.length; i++) {
                                    var method = options.update[i];
                                    this['update' + method.substring(0, 1).toUpperCase() + method.substring(1)]();
                                }
                            }
                        }

                        $timeout(function() {
                            deferred.resolve(message);
                        });

                    } else {
                        message = new App.Global.Message(false, 3, rpcCodeToMessage(err.code), {
                            rpcError: err,
                            rpcInfo: info
                        });

                        $timeout(function() {
                            deferred.reject(message)
                        });
                    }

                    return message;
                },

                getTransactions: function () {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('listtransactions', '*', 1000, 0, function (err, info) {
                        self.rpcToMessage(deferred, err, info);
                    });

                    return deferred.promise;
                },

                changePassphrase: function (oldPassphrase, newPassphrase) {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('walletpassphrasechange', oldPassphrase, newPassphrase, function (err, info) {
                        self.rpcToMessage(deferred, err, info);
                    });

                    return deferred.promise;
                },

                encryptWallet: function (passphrase) {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('encryptwallet', passphrase, function (err, info) {
                        self.rpcToMessage(deferred, err, info);
                    });

                    return deferred.promise;
                },

                newAddress: function (addressLabel) {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('getnewaddress', addressLabel, function (err, info) {
                        self.rpcToMessage(deferred, err, info);
                    });

                    return deferred.promise;
                },

                editAddress: function (address, label) {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('setaccount', address, label, function (err, info) {
                        self.rpcToMessage(deferred, err, info, {
                            update: ['info', 'accounts']
                        });
                    });

                    return deferred.promise;
                },

                lockWallet: function () {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('walletlock', function (err, info) {
                        self.rpcToMessage(deferred, err, info);
                    });

                    return deferred.promise;
                },

                send: function (data) {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('settxfee', data.fee, function (err, info) {
                        if (info || info == 'true') {
                            self.client.exec('sendtoaddress', data.address, parseFloat(data.amount), data.payerComment, data.payeeComment, function (err, info) {
                                self.rpcToMessage(deferred, err, info);
                            });
                        } else {
                            self.rpcToMessage(deferred, err, info);
                        }
                    });

                    return deferred.promise;
                },

                backupWallet: function (filename) {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('backupwallet', filename, function (err, info) {
                        self.rpcToMessage(deferred, err, info);
                    });

                    return deferred.promise;
                },

                getOverview: function () {
                    var self = this;
                    var deferred = $q.defer();

                    this.client.exec('getinfo', function (err, info) {
                        self.rpcToMessage(deferred, err, info);
                    });

                    return deferred.promise;
                },

                getAccounts: function () {

                    var self = this;
                    var deferred = $q.defer();
                    var async = require('async');

                    this.client.exec('listaccounts', function (err, accountList) {
                        if (err == null) {

                            var accounts = [];

                            for (var key in accountList) {
                                if (!accountList.hasOwnProperty(key)) continue;

                                (function (key) {
                                    async.series(
                                        {
                                            one: function (callback) {

                                                var newAccount = {
                                                    account: key,
                                                    balance: accountList[key],
                                                    address: ''
                                                };

                                                accounts.push(newAccount);

                                                self.client.exec('getaddressesbyaccount', newAccount.account, function (err, address) {
                                                    if (err != null) {
                                                        console.log(err);
                                                        callback(false);
                                                    } else {
                                                        if (address.length > 0) {
                                                            newAccount.address = address[0];
                                                            callback(true);
                                                        } else {
                                                            callback(false);
                                                        }
                                                    }
                                                });

                                            }
                                        },
                                        function (err, results) {
                                            if (err.one != null) {
                                                deferred.reject([]);
                                            } else {
                                                deferred.resolve(accounts);
                                            }
                                        }
                                    )
                                }(key));
                            }
                        }
                    });

                    return deferred.promise;
                },

                updateWalletLock: function () {
                    var self = this;
                    this.lockWallet().then(
                        function success (message) {
                            self.isEncrypted = true;
                        },
                        function failure (message) {
                            self.isEncrypted = false;
                        }
                    );
                },

                handlePassPhraseCallback: function (command, args, callback) {

                    var modal = $modal({
                        title: 'Wallet Passphrase',
                        content: "This action requires your passphrase.",
                        template: 'scripts/Wallet/Core/unlock-wallet-dialog.html',
                        show: false
                    });

                    modal.$scope.passphrase = '';
                    modal.$scope.confirm = function (passphrase) {

                        if (passphrase == '' || passphrase == null) {
                            callback(new Error('No passphrase entered.'));
                        }

                        callback(null, passphrase, 1);

                    };

                    modal.$promise.then(modal.show);
                }

            };

            return new WalletModel();
        }

    ]
);