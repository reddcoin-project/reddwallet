App.Irc.factory('IrcManager',
    [
        '$q',
        '$timeout',
        '$rootScope',
        function($q, $timeout, $rootScope) {

            function Manager() {

                this.irc = require('slate-irc');
                this.net = require('net');
                this.mainChannel = '#hoppi';
                this.chatLog = [];

                this.$q = $q;
                this.$timeout = $timeout;
                this.$rootScope = $rootScope;

                var time = new Date().getTime().toString();
                this.retrySuffix = 0;
                this.nickname = 'Reddlet' + time.substr(time.length - 6, 6);
                this.username = this.nickname;
                this.password = this.nickname;


                this.initialize();

            }

            Manager.prototype = {

                initialize: function () {

                    this.connected = false;
                    this.canChat = false;

                    this.stream = null;
                    this.client = null;

                    this.password = "";

                },

                isConnected: function () {
                    return this.connected;
                },

                disconnect: function () {
                    this.client.quit("User explicitly disconnected.");
                    this.initialize();
                },

                connect: function (nickname, username, password) {
                    this.canChat = false;
                    this.stream = this.net.connect({
                        port: 6667,
                        host: 'irc.freenode.org'
                    });

                    $timeout(function () {
                        self.chatLog.push({
                            to: nickname,
                            from: "",
                            message: "Connecting...",
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
                    this.password = password;



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
                        message = message.substring(1);
                        this.client.write(message);

                        var privateMsg = false;
                        if (message.indexOf("PRIVMSG") == 0) {
                            message = message.substring(7);
                            privateMsg = true;
                        }

                        this.chatLog.push({
                            to: channel,
                            from: this.nickname,
                            message: message,
                            time: new Date(),
                            highlight: false,
                            selfMessage: true,
                            muted: false,
                            privateMsg: privateMsg
                        });
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
                            irc.on('data', function (data) {
                                console.log(data);
                                if (data.command == 'ERR_NICKNAMEINUSE') {
                                    self.retrySuffix ++;
                                    var newNickname = self.nickname + self.retrySuffix;
                                    $timeout(function () {
                                        self.chatLog.push({
                                            to: self.nickname,
                                            from: data.prefix,
                                            message: self.nickname + ": " + data.trailing + " Retrying with " + newNickname,
                                            time: new Date(),
                                            highlight: false,
                                            selfMessage: false,
                                            muted: false
                                        });
                                    });
                                    self.connect(newNickname, newNickname, '');
                                }
                            });

                            // Reset the actual nickname we got given...
                            irc.on('welcome', function (nickname) {
                                self.nickname = nickname;

                                if (self.password != undefined && self.password.length > 0) {
                                    setTimeout(function() {
                                        self.client.send('NickServ', 'identify ' + self.password);
                                    }, 1000);
                                }

                                $timeout(function () {
                                    self.chatLog.push({
                                        to: nickname,
                                        from: "",
                                        message: "Connected, joining " + self.mainChannel + "...",
                                        time: new Date(),
                                        highlight: false,
                                        selfMessage: false,
                                        muted: true
                                    });
                                });
                            });

                            irc.on('message', function (message) {
                                $timeout(function () {

                                    var action = message.message.indexOf('\u0001ACTION') > -1;
                                    if (action) {
                                        message.message = message.message.substring(7);
                                    }

                                    var highlight = message.message.indexOf(self.nickname) > -1;
                                    if (highlight) {
                                        self.$rootScope.$emit('irc.message.highlight');
                                    }

                                    self.chatLog.push({
                                        to: message.to,
                                        from: message.from,
                                        message: message.message,
                                        time: new Date(),
                                        highlight: highlight,
                                        selfMessage: false,
                                        muted: false,
                                        action: action,
                                        privateMsg: message.to.toLowerCase() == self.nickname.toLowerCase()
                                    });
                                });
                            });

                            irc.on('join', function (join) {
                                if (join.nick == self.nickname) {
                                    self.canChat = true;
                                }
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

                            irc.on('nick', function (nick) {
                                $timeout(function () {
                                    var oldNick = nick.nick + " is";
                                    if (oldNick == self.nickname) {
                                        oldNick = "You are";
                                    }

                                   self.chatLog.push({
                                        to: "",
                                        from: "",
                                        message: oldNick + " now known as " + nick.new,
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