App.Global.factory('ExchangeManager',
    [
        '$q',
        '$timeout',
        '$rootScope',
        function($q, $timeout, $rootScope) {

            function ExchangeManager() {
                this.exchanges = {
                    cryptsy: new Cryptsy($q, $timeout, $rootScope),
                    coinbase: new Coinbase($q, $timeout, $rootScope)
                };
            }

            ExchangeManager.prototype = {
                getExchange: function (exchange) {
                    return this.exchanges[exchange];
                }
            };

            return new ExchangeManager();

        }
    ]
);

function Coinbase($q, $timeout, $rootScope) {

    this.$q = $q;
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
    this.request = require('request');
    this.baseAPI = 'https://coinbase.com/api/v1/';
    this.currencyRates = {};

    var self = this;
    var interval = setInterval(function() {
         self.loadCurrencyRates();
    }, 1000 * 60);
    self.loadCurrencyRates();

}

Coinbase.prototype = {

    getCurrencyRates: function () {
        return this.currencyRates;
    },

    loadCurrencyRates: function () {
        var self = this;
        var deferred = this.$q.defer();
        this.request(
            {
                uri: this.baseAPI + "currencies/exchange_rates",
                json: true
            },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    self.$timeout(function() {
                        self.currencyRates = body;
                        deferred.resolve(self.currencyRates);
                        self.$rootScope.$emit('exchanges.coinbase.currencyRates', self.currencyRates);
                    });
                } else {
                    deferred.reject(error, response);
                }
            }
        );

        return deferred.promise;
    }
};


function Cryptsy($q, $timeout, $rootScope) {

    this.$q = $q;
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
    this.request = require('request');
    this.baseAPI = 'http://pubapi.cryptsy.com/api.php';
    this.marketData = {

    };

    var self = this;
    var interval = setInterval(function() {
        self.loadDefaultMarkets();
    }, 1000 * 60);
    this.loadDefaultMarkets();
}

Cryptsy.prototype = {

    loadDefaultMarkets: function () {
        this.loadMarketData("RDD", 169);
        this.loadMarketData("RDD", 212);
    },

    getMarketData: function (code, marketId) {
        var key = code + ":" + marketId;

        return this.marketData[key];
    },

    loadMarketData: function (code, marketId) {
        var self = this;
        var key = code + ":" + marketId;
        var deferred = this.$q.defer();
        this.request(
            {
                uri: this.baseAPI + "?method=singlemarketdata&marketid=" + marketId,
                json: true
            },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    self.$timeout(function() {
                        if (body.success != 1) {
                            deferred.reject(error, response);
                        } else {
                            self.marketData[key] = body.return.markets[code];
                            deferred.resolve(self.marketData[key]);
                            self.$rootScope.$emit('exchanges.cryptsy.marketData', {
                                code: code,
                                marketId: marketId,
                                data: self.marketData[key]
                            });
                        }
                    });
                } else {
                    deferred.reject(error, response);
                }
            }
        );

        return deferred.promise;
    }
};