App.Irc.factory('IrcManager',
    [
        '$q',
        '$timeout',
        '$rootScope',
        'walletDb',
        function($q, $timeout, $rootScope, walletDb) {

            function Manager() {

                this.irc = require('irc');
                this.net = require('net');

                this.debugEnabled = false;

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
                    this.client = null;
                    this.password = "";
                    this.channelList = {};
                },

                connect: function (connectionDetails) {
                    this.connectionDetails = connectionDetails;

                    this.nickname = connectionDetails.nickname;
                    this.username = connectionDetails.username;
                    this.password = connectionDetails.password;

                    this.client = new this.irc.Client(connectionDetails.serverHost, connectionDetails.nickname, {
                        userName:  connectionDetails.username,
                        realName: connectionDetails.username,
                        port: 7000,
                        password: connectionDetails.serverPassword,
                        debug: false,
                        showErrors: false,
                        autoRejoin: true,
                        autoConnection: true,
                        channels: [],
                        secure: connectionDetails.serverSsl,
                        selfSigned: false,
                        certExpired: false,
                        floodProtection: false,
                        floodProtectionDelay: 1000,
                        sasl: false,
                        stripColors: true,
                        channelPrefixes: "&#",
                        messageSplit: 256
                    });

                    this.initializeServerChannel(connectionDetails.serverHost);

                    this.setupListeners();
                },

                disconnect: function () {
                    this.client.disconnect("User explicitly disconnected.");
                    this.initialize();
                },

                isConnected: function () {
                    return this.connected;
                },

                initializeServerChannel: function (hostname) {
                    var self = this;

                    self.serverChannel = new App.Irc.Channel();
                    self.serverChannel.name = hostname;
                    self.serverChannel.prettyName = hostname;
                    self.serverChannel.connected = true;
                    self.serverChannel.server = true;
                    self.serverChannel.privateUser = true;


                    $timeout(function() {
                        self.channelList[self.serverChannel.name] = self.serverChannel;
                        self.switchChannel(self.serverChannel.name);
                        self.connected = true;
                    });
                },

                joinChannel: function (channel, callback) {
                    this.client.join(channel, callback);
                },

                partChannel: function (channel, callback) {
                    if (channel == this.connectionDetails.serverHost) {
                        this.disconnect();
                        return;
                    }

                    var self = this;
                    if (this.channelExists(channel)) {

                        var channelObj = this.getChannel(channel);

                        if (channelObj.privateUser) {
                            $timeout(function() {
                                delete this.channelList[channelObj.name];
                                // Switch to a new channel (so no blank screen)
                                for (var key in self.channelList) {
                                    var channel = self.channelList[key];
                                    self.switchChannel(channel.name);
                                    break;
                                }
                            });
                        } else {
                            $timeout(function() {
                                self.client.part(channel, callback);
                            });
                        }
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
                    var prettyName = channelName;

                    channelName = channelName.toLowerCase();
                    var channel = new App.Irc.Channel();

                    channel.name = channelName;
                    channel.prettyName = prettyName;

                    this.channelList[channelName] = channel;

                    return channel;
                },

                initUserPmChannel: function (channelName) {
                    var channel = this.initChannel(channelName);
                    channel.privateUser = true;
                    channel.connected = true;

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

                isUserPm: function (channel) {
                    return !(channel.substring(0, 1) === '#')
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
                        } else if (message.toLowerCase().indexOf("trout") == 0) {
                            parts = properSplit(message, " ", 2);
                            if (parts.length !== 2) return;

                            messageToSend = "slaps " + parts[1] + " round the face with a large trout.";
                            msgOptions.action = true;
                        }
                    }

                    if (!this.channelExists(channelTarget)) {
                        var newChannel = this.initChannel(channelTarget);
                        if (this.isUserPm(channelTarget)) {
                            newChannel.privateUser = true;
                            newChannel.connected = true;

                            msgOptions.privateMsg = true;
                            msgOptions.sent = true;
                        }
                    }

                    if (msgOptions.action) {
                        this.client.action(channelTarget, messageToSend);
                    } else {
                        this.client.say(channelTarget, messageToSend);
                    }

                    this.pushMessageToChannel(channelTarget, this.newSelfMessage(channelTarget, messageToSend, msgOptions));
                },

                setupListeners: function () {
                    var self = this;

                    this.client.addListener('registered', function (message) {
                        self.debug("Connected, now joining default channel.");

                        if (self.password != undefined && self.password.length > 0) {
                            setTimeout(function() {
                                self.client.send('NickServ', 'identify ' + self.password);
                            }, 1000);
                        }

                        var logMessage = self.newMessage(self.connectionDetails.serverHost, "", "Welcome " + self.nickname);
                        self.pushMessageToChannel(logMessage.to, logMessage);

                        self.joinChannel(self.connectionDetails.defaultChannel);
                    });

                    this.client.addListener('motd', function (motd) {
                        var logMessage = self.newMessage(self.serverChannel.name, '', motd);
                        self.pushMessageToChannel(logMessage.to, logMessage);
                    });

                    this.client.addListener('notice', function (nick, to, text, message) {
                        if (to == "*") {
                            to = self.serverChannel.name;
                        }

                        var logMessage = self.newMessage(to, nick, text);
                        self.pushMessageToChannel(logMessage.to, logMessage);
                    });

                    this.client.addListener('topic', function (channel, topic, nick, message) {
                        var logMessage = self.newSelfMessage(channel, topic);
                        self.pushMessageToChannel(logMessage.to, logMessage);
                    });

                    this.client.addListener('join', function (channel, nick, message) {
                        if (nick == self.nickname) {
                            if (!self.channelExists(channel)) {
                                self.initChannel(channel);
                            }
                        } else {
                            $timeout(function() {
                                self.getChannel(channel).addUser(nick);
                            });
                        }

                        self.getChannel(channel).connected = true;

                        var logMessage = self.newMessage(channel, channel, nick + " has joined " + channel, {
                            from: channel,
                            muted: true
                        });

                        // Only switch if it is a channel and it is us that is joining it
                        if (channel.substring(0, 1) == '#' && nick.toLowerCase() == self.nickname.toLowerCase()) {
                            self.switchChannel(channel);
                        }

                        self.pushMessageToChannel(logMessage.to, logMessage);
                    });

                    this.client.addListener('part', function (channel, nick, reason, message) {
                        if (nick.toLowerCase() == self.nickname.toLowerCase()) {
                            var channelName = channel;
                            $timeout(function() {
                                delete self.channelList[channelName];
                                // Switch to a new channel (so no blank screen)
                                for (var key in self.channelList) {
                                    var channel = self.channelList[key];
                                    self.switchChannel(channel.name);
                                    break;
                                }
                            });

                            return; // Can't add a message to a non-existent channel
                        } else {
                            $timeout(function() {
                                self.getChannel(channel).removeUser(nick);
                            });
                        }

                        if (reason == null || reason.length == undefined) {
                            reason = "None";
                        }

                        var partMessage =  nick + " has left " + channel + " (Reason: " + reason + ")";

                        var logMessage = self.newMessage(channel, channel, partMessage, {
                            muted: true
                        });

                        self.pushMessageToChannel(logMessage.to, logMessage);
                    });

                    this.client.addListener('quit', function (nick, reason, channels, message) {
                        for (var key in self.channelList) {
                            var channel = self.channelList[key];

                            if (!channel.userExists(nick)) {
                                continue;
                            }

                            $timeout(function() {
                                channel.removeUser(nick);
                            });

                            if (channel.name == self.connectionDetails.serverHost) {
                                continue;
                            }

                            if (reason == undefined) {
                                reason = "None";
                            }

                            var logMessage = self.newMessage(channel.name, nick, nick + " has quit (Reason: " + reason + ")", {
                                muted: true
                            });

                            self.pushMessageToChannel(logMessage.to, logMessage);
                        }
                    });

                    this.client.addListener('nick', function (oldnick, newnick, channels, message) {
                        for (var key in self.channelList) {
                            var channel = self.channelList[key];

                            if (!channel.userExists(oldnick)) {
                                continue; // If we don't have the channel then don't do anything
                            }

                            channel.removeUser(oldnick);
                            channel.addUser(newnick);

                            var logMessage = self.newMessage(channel.name, channel.name, oldnick + " has changed their nickname to " + newnick, {
                                muted: true
                            });

                            self.pushMessageToChannel(logMessage.to, logMessage);
                        }
                    });

                    this.client.addListener('message', function (nick, to, text, message) {
                        var logMessage = self.newMessage(to, nick, text);
                        var channel = null;

                        var channelName = to;
                        var isUserPm = self.isUserPm(channelName);

                        if (isUserPm) {
                            // User, so the channel name needs to be changed to the "from" as its 1 on 1
                            channelName = logMessage.from;
                        }

                        if (!self.channelExists(channelName)) {
                            if (isUserPm) {
                                // User channel initialize the channel to be the other user
                                channel = self.initUserPmChannel(channelName);
                            } else {
                                // It is a proper channel initialize it..
                                channel = self.initChannel(channelName);
                            }
                        } else {
                            channel = self.getChannel(channelName);
                        }

                        if (isUserPm) {
                            logMessage.privateMsg = true;
                            logMessage.sent = false;
                        }

                        if (logMessage.message.indexOf('\u0001ACTION') > -1) {
                            logMessage.action = true;
                            logMessage.message = logMessage.message.substring(7);
                        }

                        if (logMessage.message.indexOf(" " + self.nickname + " ") > -1) {
                            self.$rootScope.$emit('irc.message.highlight', logMessage);
                            logMessage.highlight = true;
                        }

                        self.pushMessageToChannel(logMessage.to, logMessage);

                    });

                    this.client.addListener('names', function (channel, nicks) {
                        var combined = [];
                        for (var nick in nicks) {
                            if (!nicks.hasOwnProperty(nick)) continue;
                            var mode = nicks[nick];
                            combined.push(mode+nick);
                        }

                        $timeout(function() {
                            self.getChannel(channel).users = combined.sort();
                        });
                    });

                    this.client.addListener('raw', function (message) {
                        self.debug("## RAW MESSAGE ---------------------------------");
                        self.debug(message);
                    });

                    this.client.addListener('error', function (message) {
                        self.debug("!! ERROR ---------------------------------");
                        self.debug(message);

                        var logMessage = null;

                        if (message.command == 'err_nosuchnick') {
                            logMessage = self.newMessage(message.args[1], self.serverChannel.name, message.args[2], {
                                muted: true
                            });

                            self.pushMessageToChannel(logMessage.to, logMessage);
                        } else if (message.command == 'err_nosuchchannel') {
                            logMessage = self.newMessage(self.serverChannel.name, self.serverChannel.name, message.args[2], {
                                muted: true
                            });

                            self.pushMessageToChannel(logMessage.to, logMessage);
                        }
                    });
                },

                debug: function (message) {
                    if (this.debugEnabled) {
                        console.log(message);
                    }
                }

            };

            return new Manager();

        }

    ]
);