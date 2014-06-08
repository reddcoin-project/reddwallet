App.Wallet.OverviewModel = (function () {

    function Model (walletDb) {

        this.walletDb = walletDb;
        this.initialized = false;

        // Defaults
        this.version = "";
        this.protocolversion = "";
        this.walletversion = "";
        this.balance = 0;
        this.unconfirmed = 0;
        this.blocks = 0;
        this.timeoffset = 0;
        this.connections = 0;
        this.proxy = "";
        this.difficulty = 0;
        this.testnet = false;
        this.keypoololdest = 0;
        this.keypoolsize = 0;
        this.paytxfee = 0;
        this.mininput = 0.00;
        this.errors = "";

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
