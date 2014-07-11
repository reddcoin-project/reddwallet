App.Irc.Channel = (function () {

    function Model () {

        this.name = '';
        this.log = [];
        this.users = [];
        this.connected = false;

        this.privateUser = false;

        this.limitLog = true;
        this.limitAmount = 250;

    };

    Model.prototype = {

        addMessage: function (message) {
            message.channel = this; // Assign ourselves to the channel

            this.log.push(message);

            if (this.limitLog && this.log.length > this.limitAmount) {
                this.log.shift();
            }
        },

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
