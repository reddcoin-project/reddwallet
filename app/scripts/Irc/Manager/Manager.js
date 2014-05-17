App.Irc.factory('IrcManager',
    [
        '$q',
        '$timeout',
        '$rootScope',
        function($q, $timeout, $rootScope) {

            function Manager() {

                this.$q = $q;
                this.$timeout = $timeout;
                this.$rootScope = $rootScope;

                this.connected = false;

                this.irc = require('slate-irc');
                this.net = require('net');
                this.mainChannel = '#reddcoin';
                this.chatLog = [];

                this.stream = null;
                this.client = null;

                this.initialize();

            }

            Manager.prototype = {

                initialize: function () {



                },

                isConnected: function () {
                    return this.connected;
                },

                connect: function (nickname, username, password) {
                    if (this.isConnected()) {
                        return false;
                    }

                    this.stream = this.net.connect({
                        port: 6667,
                        host: 'irc.freenode.org'
                    });

                    $timeout(function () {
                        self.chatLog.push({
                            to: nickname,
                            from: self.mainChannel,
                            message: "Connecting to #reddcoin...",
                            time: new Date(),
                            highlight: false,
                            selfMessage: false,
                            muted: false
                        });
                    });

                    this.client = this.irc(this.stream);

                    this.client.nick(nickname);
                    this.client.user(username, username);
                    this.client.join(this.mainChannel);

                    this.nickname = nickname;
                    this.username = username;

                    if (password != undefined) {
                        this.client.pass(password);
                    }

                    this.setupHandler();

                    var self = this;
                    this.$timeout(function() {
                        self.connected = true;
                    });
                },

                send: function (channel, message) {
                    if (!this.isConnected() || message.length == 0) {
                        return false;
                    }

                    if (message.indexOf("/") === 0) {
                        // This is an action don't send it until we know what it is...
                        if (message.indexOf("/me") === 0) {

                        }
                    } else {
                        this.client.send(channel, message);
                        this.chatLog.push({
                            to: channel,
                            from: this.nickname,
                            message: message,
                            time: new Date(),
                            highlight: false,
                            selfMessage: true,
                            muted: false
                        });
                    }
                },

                setupHandler: function () {
                    var self = this;
                    function handler () {
                        return function (irc) {
                            // Reset the actual nickname we got given...
                            irc.on('welcome', function (nickname) {
                                self.nickname = nickname;
                                $timeout(function () {
                                    self.chatLog.push({
                                        to: nickname,
                                        from: self.mainChannel,
                                        message: "Connected.",
                                        time: new Date(),
                                        highlight: false,
                                        selfMessage: false,
                                        muted: true
                                    });
                                });
                            });

                            irc.on('message', function (message) {
                                console.log("MESSAGE------------------------------");
                                console.log(message);
                                $timeout(function () {
                                    self.chatLog.push({
                                        to: message.to,
                                        from: message.from,
                                        message: message.message,
                                        time: new Date(),
                                        highlight: (message.message.indexOf(self.nickname) > -1),
                                        selfMessage: false,
                                        muted: false
                                    });
                                });
                            });

                            irc.on('join', function (join) {
                                $timeout(function () {
                                    self.chatLog.push({
                                        to: join.channel,
                                        from: join.nick,
                                        message: join.nick + " has joined " + join.channel,
                                        time: new Date(),
                                        highlight: false,
                                        selfMessage: false,
                                        muted: true
                                    });
                                });
                            });

                            irc.on('quit', function (quit) {
                                $timeout(function () {
                                    self.chatLog.push({
                                        to: self.mainChannel,
                                        from: quit.nick,
                                        message: quit.nick + " has quit [" + quit.message + "]",
                                        time: new Date(),
                                        highlight: false,
                                        selfMessage: false,
                                        muted: true
                                    });
                                });
                            });

                            irc.on('notice', function (notice) {
                                $timeout(function () {
                                    self.chatLog.push({
                                        to: notice.to,
                                        from: notice.from,
                                        message: notice.message,
                                        time: new Date(),
                                        highlight: false,
                                        selfMessage: false,
                                        muted: true
                                    });
                                });
                            });
                        }
                    }

                    this.client.use(handler());
                }

            };

            return new Manager();

        }

    ]
);