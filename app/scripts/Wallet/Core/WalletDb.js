App.Wallet.factory('walletDb',
    [
        '$q',
        '$timeout',
        '$rootScope',
        'walletRpc',
        function ($q, $timeout, $rootScope, walletRpc) {

            /**
             * This the front for the controllers, this will perform the necessary actions onto the daemon IF required.
             *
             * REFACTOR EVERYTHING
             *
             * @constructor
             */
            var DbModel = function ($q, $timeout, $rootScope, walletRpc) {

                this.$q = $q;
                this.$timeout = $timeout;
                this.$rootScope = $rootScope;

                this.walletRpc = walletRpc;

                this.overviewModel = new App.Wallet.OverviewModel(this);

                this.accounts = App.Global.NeDB.collection('wallet_accounts');
                this.accounts.ensureIndex({
                    fieldName: 'address',
                    unique: true
                });
                this.accounts.ensureIndex({
                    fieldName: 'name',
                    unique: true
                });

                this.receivingAccounts = [];
                this.sendingAccounts = [];

                this.transactions = [];

            };

            DbModel.prototype = {

                /**
                 * Overview is always real time, this will just forward it to the wallet.
                 */
                updateOverview: function () {
                    var self = this;
                    var promise = this.walletRpc.getOverview();

                    this.applyModelPromise(this.overviewModel, promise);

                    promise.then(function (message) {
                        self.$timeout(function () {
                            self.oveviewModel = message.model;
                        });
                    });

                    return promise;
                },

                getReceivingAccounts: function () {
                    var self = this;
                    var deferred = self.$q.defer();

                    this.accounts.find({type: 'receive'}, function (err, accounts) {
                        if (err != null) {
                            deferred.reject(err);
                        }

                        self.$timeout(function () {
                            self.receivingAccounts = accounts;
                            deferred.resolve(self.receivingAccounts);
                        });
                    });

                    return deferred.promise;
                },

                getSendingAccounts: function () {
                    var self = this;
                    var deferred = self.$q.defer();

                    this.accounts.find({type: 'send'}, function (err, accounts) {
                        if (err != null) {
                            deferred.reject(err);
                        }

                        self.$timeout(function () {
                            self.sendingAccounts = accounts;
                            deferred.resolve(self.sendingAccounts);
                        });
                    });

                    return deferred.promise;
                },

                getAccountsByCriteria: function(criteria) {
                    var deferred = this.$q.defer();

                    this.accounts.find(criteria, function (err, account) {
                        if (err != null) {
                            deferred.reject(err);
                        }

                        deferred.resolve(account);
                    });

                    return deferred.promise;
                },

                getAccountByCriteria: function(criteria) {
                    var deferred = this.$q.defer();

                    this.accounts.findOne(criteria, function (err, account) {
                        if (err != null) {
                            deferred.reject(err);
                        }

                        deferred.resolve(account);
                    });

                    return deferred.promise;
                },

                /**
                 * If this application is being loaded from a separate program then it will add all the addresses and their
                 * account labels to the database. If the address already exists within the database it won't do anything.
                 */
                syncAccounts: function(callback) {
                    var self = this;
                    var deferred = self.$q.defer();
                    var accountsPromise = self.getRpc().getAccounts();

                    accountsPromise.then(
                        function success(accounts) {
                            for (var i = 0; i < accounts.length; i++) {
                                var rpcAcc = accounts[i];
                                var accPromise = self.getAccountByCriteria({address: rpcAcc.address});
                                (function (rpcAcc) {
                                    accPromise.then(
                                        function success (dbAccount) {
                                            if (dbAccount == null || dbAccount._id === undefined) {

                                                if (rpcAcc.address == "") {
                                                    return null;
                                                }

                                                // No address exists in the database for this address, add it.
                                                var accModel = {
                                                    type: 'receive',
                                                    name: rpcAcc.account, // This is the actual name of the account...
                                                    label: rpcAcc.account,
                                                    address: rpcAcc.address,
                                                    notes: ''
                                                };

                                                self.accounts.insert(accModel, function (err, newDbAccount) {
                                                    if (err == null) {

                                                    } else {
                                                        // Address failure insert...
                                                    }
                                                });
                                            }
                                        },
                                        function error (error) {
                                        }
                                    );
                                }(rpcAcc));
                            }
                        },
                        function error(accounts) {

                        }
                    );
                },

                /**
                 * Addresses in the wallet will be named after their first label given to them.
                 * @param label
                 */
                newAddress: function (label) {
                    var self = this;
                    var deferred = this.$q.defer();
                    var promise = this.getRpc().newAddress(label);

                    promise.then(function (message) {

                        var address = message.rpcInfo;

                        var accModel = {
                            type: 'receive',
                            name: label,
                            label: label,
                            address: address,
                            notes: ''
                        };

                        self.accounts.insert(accModel, function (err, account) {
                            if (err == null) {
                                deferred.resolve(new App.Global.Message(true, 0, '', {
                                    dbModel: account
                                }));
                            } else {
                                deferred.reject(new App.Global.Message(false, -5, '', {
                                    dbError: err,
                                    dbModel: account
                                }));
                            }
                        });

                        return message;

                    });

                    return deferred.promise;
                },

                newContact: function (label, address) {
                    var self = this;
                    var deferred = self.$q.defer();

                    var accModel = {
                        type: 'send',
                        name: label,
                        label: label,
                        address: address,
                        notes: ''
                    };

                    self.accounts.insert(accModel, function (err, account) {
                        if (err == null) {
                            deferred.resolve(new App.Global.Message(true, 0, '', {
                                dbModel: account
                            }));
                        } else {
                            deferred.reject(new App.Global.Message(false, -5, '', {
                                dbError: err,
                                dbModel: account
                            }));
                        }
                    });

                    return deferred.promise;
                },

                updateAccount: function (account, newData) {
                    var self = this;
                    var deferred = self.$q.defer();

                    self.accounts.update({_id: account._id}, { $set: newData }, function (err, numReplaced) {
                        if (err != null) {
                            deferred.reject(new App.Global.Message(false, 5, '', {
                                dbError: err
                            }));
                        } else {
                            deferred.resolve(new App.Global.Message(true, 0, '', {
                                dbReplaced: numReplaced
                            }));
                        }
                    });

                    return deferred.promise;
                },

                deleteAccount: function (account) {
                    var self = this;
                    var deferred = self.$q.defer();

                    self.accounts.remove({_id: account._id}, function (err, numDeleted) {
                        if (err != null) {
                            deferred.reject(new App.Global.Message(false, 5, '', {
                                dbError: err
                            }));
                        } else {
                            deferred.resolve(new App.Global.Message(true, 0, '', {
                                dbReplaced: numDeleted
                            }));
                        }
                    });

                    return deferred.promise;
                },

                getRpc: function () {
                    return this.walletRpc;
                },

                getTransactions: function () {
                    var self = this;
                    var trans = this.walletRpc.getTransactions();

                    trans.then(function(message) {
                        $timeout(function() {
                            var trans = message.rpcInfo;

                            for (var i = 0; i < trans.length; i++) {
                                trans[i].time = parseInt(trans[i].time);
                                trans[i].amount = parseFloat(trans[i].amount);
                            }

                            self.transactions = trans;
                        });

                        return message;
                    });

                    return trans;
                },

                /**
                 * This will fill the data of a specified model when the promise is resolved, if rejected
                 * it will just return the default modal.
                 * @param model
                 * @param promise
                 */
                applyModelPromise: function (model, promise) {
                    promise.then(
                        function success (message) {
                            model.fill(message.rpcInfo);
                            message.model = model;

                            return message;
                        },
                        function error (message) {
                            message.model = model;

                            return message;
                        }
                    );
                },

                /**
                 * This will automatically apply to the angular app upon success.
                 *
                 * This is used for real time stuff basically.
                 *
                 * @param promise
                 */
                applyUpdatePromise: function (promise) {
                    var self = this;
                    promise.then(
                        function success (message) {
                            self.$rootScope.$apply();

                            return message;
                        },
                        function error (message) {
                            return message;
                        }
                    );
                },

                runAsync: function (fn) {
                    var async = require('async');
                    async.series(
                        {
                            one: function (callback) {
                                callback(fn());
                            }
                        },
                        function (err, results) {
                            return results;
                        }
                    );
                }

            };

            return new DbModel($q, $timeout, $rootScope, walletRpc);
        }

    ]
);