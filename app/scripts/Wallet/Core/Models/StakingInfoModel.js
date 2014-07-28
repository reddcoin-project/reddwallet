App.Wallet.StakingInfoModel = (function () {

    function Model (walletDb) {

        this.walletDb = walletDb;
        this.initialized = false;

        // Defaults
        this.enabled = false;
        this.staking = false;
        this.difficulty = 0;
        this.errors = "";

        this.averageweight = 0;
        this.totalweight = 0;
        this.netstakeweight = 0;
        this.expectedtime = 0;

        this.currentblocksize = 0;
        this.currentblocktx = 0;
        this.pooledtx = 0;
        this['search-interval'] = 0;

    }

    Model.prototype = {

        get: function (key) {
            return this[key.toLowerCase()];
        },

        set: function (key, value) {
            this[key] = value;
        },

        initialize: function () {
            if (!this.initialized) {

                this.initialized = true;
            }
        },

        fill: function(properties) {
            if (_.isObject(properties)) {
                for (var key in properties) {
                    if (!properties.hasOwnProperty(key)) {
                        continue;
                    }

                    this.set(key, properties[key]);
                }
            }
        }

    };


    return Model;

}());
