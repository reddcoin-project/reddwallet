App.Irc.Message = (function () {

    function Model () {

        this.channel = null;

        this.to = "";
        this.from = "";
        this.message = "";
        this.time = new Date();
        this.highlight = false;
        this.action = false;
        this.selfMessage = false;
        this.muted = false;


        this.sent = false;
        this.privateMsg = false;

    };

    Model.prototype = {

        get: function (key) {
            return this[key];
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
