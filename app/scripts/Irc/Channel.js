App.Irc.Channel = (function () {

    function Model () {

        this.name = '';
        this.prettyName = '';

        this.log = [];
        this.users = [];

        this.server = false;
        this.connected = false;

        this.privateUser = false;

        this.limitLog = true;
        this.limitAmount = 100; // Only we to render quickly..
        this.unseenMessages = 0;

    }

    Model.prototype = {

        userExists: function (nick) {
            for (var i = 0; i < this.users.length; i++) {
                var user = this.users[i];

                if (this.stripMode(user, true) == this.stripMode(nick, true)) {
                    return true;
                }
            }

            return false;
        },

        addUser: function (user) {
            this.users.push(user);
            this.users = this.users.sort();
        },

        removeUser: function (nick) {
            for (var i = 0; i < this.users.length; i++) {
                var user = this.users[i];

                if (this.stripMode(user, true) == this.stripMode(nick, true)) {
                    delete this.users[i];

                    break;
                }
            }
        },

        stripMode: function (nick, toLower) {

            if (nick == undefined || nick.indexOf == undefined) {
                return '';
            }

            if (nick.indexOf("@") === 1 || nick.indexOf("+") === 1) {
                nick = nick.substring(0, 1);
            }

            if (toLower != undefined && toLower == true) {
                nick = nick.toLowerCase();
            }

            return nick;
        },

        addMessage: function (message) {
            message.channel = this; // Assign ourselves to the channel

            if (this.privateUser) {
                message.privateMsg = true;
            }

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
