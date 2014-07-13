App.Irc.factory('IrcManager',
    [
        '$q',
        '$timeout',
        '$rootScope',
        'walletDb',
        function($q, $timeout, $rootScope, walletDb) {

            function Manager() {

                this.irc = require('slate-irc');
                this.net = require('net');

                this.currentChannel = '';

                this.$q = $q;
                this.$timeout = $timeout;
                this.$rootScope = $rootScope;
                this.channelList = {};

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
                    this.stream = null;
                    this.client = null;
                    this.password = "";
                    this.channelList = {};

                },

                isConnected: function () {
                    return this.connected;
                },

                disconnect: function () {
                    this.client.quit("User explicitly disconnected.");
                    this.initialize();
                },

                updateUserList: function (channel, callback) {
                    var self = this;
                    if (this.client == null) {
                        return;
                    }

                    this.client.names(channel, function (error, names) {
                        $timeout(function () {

                            var operators = [];
                            var voiced = [];
                            var users = [];

                            for (var i = 0; i < names.length; i++) {
                                var user = names[i];

                                if (user.mode == "@") {
                                    operators.push(user.mode + user.name);
                                } else if (user.mode == "+") {
                                    voiced.push(user.mode + user.name);
                                } else {
                                    users.push(user.mode + user.name);
                                }
                            }

                            operators.sort();
                            voiced.sort();
                            users.sort();

                            if (!self.channelExists(channel)) {
                                self.initChannel(channel);
                            }

                            self.getChannel(channel).users = operators.concat(voiced.concat(users));
                            typeof callback === 'function' && callback();
                        });
                    });
                },

                connect: function (connectionDetails) {
                    var self = this;
                    this.connectionDetails = connectionDetails;

                    this.stream = this.net.connect({
                        port: connectionDetails.serverPort,
                        host: connectionDetails.serverHost
                    });

                    var serverChannel = new App.Irc.Channel();
                    serverChannel.name = connectionDetails.serverHost;
                    serverChannel.connected = true;
                    serverChannel.server = true;

                    $timeout(function() {
                        self.channelList[serverChannel.name] = serverChannel;
                        self.switchChannel(serverChannel.name);
                    });

                    this.client = this.irc(this.stream);

                    this.setupHandler();

                    this.client.nick(connectionDetails.nickname);
                    this.client.user(connectionDetails.username, connectionDetails.username);
                    this.client.pass(connectionDetails.serverPassword);

                    this.nickname = connectionDetails.nickname;
                    this.username = connectionDetails.username;
                    this.password = connectionDetails.password;

                    this.joinChannel(connectionDetails.defaultChannel);

                    this.$timeout(function() {
                        self.connected = true;
                    });
                },

                joinChannel: function (channel) {
                    this.client.join(channel);
                },

                partChannel: function (channel) {
                    if (channel == this.connectionDetails.serverHost) {
                        this.disconnect();
                        return;
                    }

                    var self = this;
                    if (this.channelExists(channel)) {
                        $timeout(function() {
                            self.client.part(channel);
                        });
                    }
                },

                switchChannel: function (channel) {
                    var self = this;
                    $timeout(function () {
                        self.currentChannel = channel;
                    });
                },

                pushMessageToDefaultChannel: function (message) {
                    this.pushMessageToChannel(this.currentChannel, message);
                },

                pushMessageToChannel: function (channelName, message) {
                    channelName = channelName.toLowerCase();

                    if (message.privateMsg) {
                        if (message.sent) {
                            channelName = message.to;
                        } else {
                            channelName = message.from;
                        }
                    }

                    if (!this.channelExists(channelName)) {
                        this.initChannel(channelName);
                    }

                    var self = this;
                    $timeout(function () {
                        self.getChannel(channelName).addMessage(message);
                    });
                },

                channelExists: function (channelName) {
                    channelName = channelName.toLowerCase();
                    return this.channelList[channelName] != undefined;
                },

                getChannel: function (channelName) {
                    channelName = channelName.toLowerCase();
                    return this.channelList[channelName];
                },

                initChannel: function (channelName) {
                    channelName = channelName.toLowerCase();
                    var channel = new App.Irc.Channel();
                    channel.name = channelName;
                    this.channelList[channelName] = channel;

                    return channel;
                },

                newMessage: function (channel, from, message, options) {
                    var msg = new App.Irc.Message();

                    msg.fill({
                        to: channel,
                        from: from,
                        message: message,
                        time: new Date()
                    });

                    if (options != undefined) {
                        msg.fill(options);
                    }

                    return msg;
                },

                newSelfMessage: function (channel, message, options) {
                    return this.newMessage(channel, this.nickname, message, options);
                },

                send: function (channel, message) {
                    if (!this.isConnected() || message.length == 0) return;

                    var parts;
                    var msgOptions = {};
                    var channelTarget = this.currentChannel;
                    var messageToSend = message;

                    if (message.indexOf("/") === 0) {
                        message = message.substring(1);
                        if (message.indexOf("PRIVMSG") == 0 || message.toLowerCase().indexOf("msg") == 0) {
                            parts = properSplit(message, " ", 2);
                            if (parts.length == 2)  return;

                            channelTarget = parts[1];
                            messageToSend = parts[2];
                        } else if (message.toLowerCase().indexOf("join") == 0) {
                            parts = properSplit(message, " ", 2);
                            if (parts.length !== 2) return;

                            this.joinChannel(parts[1]);

                            return;
                        } else if (message.toLowerCase().indexOf("part") == 0) {
                            parts = properSplit(message, " ", 2);
                            if (parts.length !== 2) return;

                            this.partChannel(parts[1]);

                            return;
                        } else if (message.toLowerCase().indexOf("me") == 0) {
                            messageToSend = message.substring(3);
                            msgOptions.action = true;
                        }
                    }

                    if (!this.channelExists(channelTarget)) {
                        var newChannel = this.initChannel(channelTarget.toLowerCase());
                        if (channel.substring(0, 1) !== '#') {
                            newChannel.privateUser = true;
                            newChannel.connected = true;

                            msgOptions.privateMsg = true;
                            msgOptions.sent = true;
                        }
                    }

                    if (msgOptions.action) {
                        this.client.action(channelTarget, messageToSend);
                    } else {
                        this.client.send(channelTarget, messageToSend);
                    }

                    this.pushMessageToChannel(channelTarget, this.newSelfMessage(channelTarget, messageToSend, msgOptions));
                },

                setupHandler: function () {
                    var self = this;
                    function handler () {
                        return function (irc) {
                            var logMessage;

                            irc.on('data', function (data) {
                                if (data.command == 'ERR_NICKNAMEINUSE') {
                                    self.retrySuffix ++;
                                    var newNickname = self.nickname + self.retrySuffix;
                                    self.connect(newNickname, newNickname, '');
                                    logMessage = self.newMessage(self.connectionDetails.serverHost, data.from, data.trailing);
                                    self.pushMessageToChannel(self.connectionDetails.serverHost, logMessage);
                                } else if (data.command == 'RPL_TOPIC') {
                                    logMessage = self.newMessage(self.connectionDetails.serverHost, data.from, data.message);
                                    self.pushMessageToChannel(self.connectionDetails.serverHost, logMessage);
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

                                var logMessage = self.newMessage(self.connectionDetails.serverHost, "", "Welcome " + nickname);
                                self.pushMessageToChannel(logMessage.to, logMessage);
                            });

                            irc.on('message', function (message) {

                                var logMessage = self.newMessage(message.to, message.from, message.message);

                                var channel = null;
                                if (!self.channelExists(message.to)) {
                                    if (message.message.substring(0, 1) !== '#') {
                                        // User channel initialize the channel to be the other user
                                        channel = self.initChannel(message.from);
                                        channel.privateUser = true;
                                        channel.connected = true;
                                    } else {
                                        // It is a proper channel initialize it..
                                        channel = self.initChannel(message.to);
                                    }
                                } else {
                                    channel = self.getChannel(message.to);
                                };

                                if (channel.privateUser) {
                                    logMessage.privateMsg = true;
                                }

                                if (message.message.indexOf('\u0001ACTION') > -1) {
                                    logMessage.action = true;
                                    logMessage.message = message.message.substring(7);
                                }

                                if (message.message.indexOf(self.nickname) > -1) {
                                    self.$rootScope.$emit('irc.message.highlight', logMessage);
                                }

                                self.pushMessageToChannel(logMessage.to, logMessage);
                            });

                            irc.on('join', function (join) {

                                var joinChannel = join.channel;
                                if (join.nick == self.nickname) {
                                    if (!self.channelExists(joinChannel)) {
                                        self.initChannel(joinChannel);
                                    }
                                }

                                self.getChannel(joinChannel).connected = true;

                                var logMessage = self.newMessage(joinChannel, joinChannel, join.nick + " has joined " + joinChannel, {
                                    from: join.nick,
                                    muted: true
                                });

                                if (joinChannel.substring(0, 1) == '#') {
                                    // Actual channel
                                    self.switchChannel(joinChannel);
                                }

                                self.pushMessageToChannel(logMessage.to, logMessage);
                                self.updateUserList(joinChannel);
                            });

                            irc.on('quit', function (quit) {
                                for (var i = 0; i < self.channelList.length; i++) {
                                    var channel = self.channelList[i];
                                    if (channel.name == self.connectionDetails.serverHost) {
                                        continue;
                                    }

                                    logMessage = self.newMessage(channel, part.nick, part.nick + " has quit. ", {
                                        muted: true
                                    });

                                    self.pushMessageToChannel(logMessage.to, logMessage);
                                    self.updateUserList(channel);
                                }
                            });

                            irc.on('part', function (part) {
                                for (var i = 0; i < part.channels.length; i++) {
                                    var partedChannel = part.channels[i];

                                    if (part.nick.toLowerCase() == self.nickname.toLowerCase()) {
                                        $timeout(function() {
                                            delete self.channelList[partedChannel];
                                        });

                                        continue;
                                    }

                                    var partMessage = part.message.length == 0 ? part.nick + " has left " + partedChannel : part.message;
                                    logMessage = self.newMessage(partedChannel, part.nick, partMessage, {
                                        muted: true
                                    });

                                    self.pushMessageToChannel(logMessage.to, logMessage);
                                    self.updateUserList(partedChannel);
                                }
                            });

                            irc.on('notice', function (notice) {
                                if (notice.to == "*") {
                                    notice.to = self.connectionDetails.serverHost;
                                }

                                logMessage = self.newMessage(notice.to, notice.from, notice.message);

                                self.pushMessageToChannel(logMessage.to, logMessage);
                            });

                            irc.on('nick', function (nick) {
                                for (var key in self.channelList) {
                                    if (!self.channelList.hasOwnProperty(key)) {
                                        continue;
                                    }

                                    var channel = self.channelList[key];

                                    var oldNick = nick.nick + " is";
                                    if (oldNick == self.nickname) {
                                        oldNick = "You are";
                                    }

                                    var logMessage = self.newMessage(channel.name, nick.new, oldNick + " now known as " + nick.new, {
                                        muted: true
                                    });

                                    self.pushMessageToChannel(channel.name, logMessage);
                                    self.updateUserList(channel.name);
                                }
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