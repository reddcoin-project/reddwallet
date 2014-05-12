App.Wallet.AccountModel = (function () {

    function Model (walletDb) {

        this.walletDb = walletDb;

    }

    Model.prototype = {

        get: function (key) {
            return this[key.toLowerCase()];
        },

        set: function (key, value) {
            this[key] = value;
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
