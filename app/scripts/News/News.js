App.Irc.factory('News',
    [
        '$q',
        '$timeout',
        '$rootScope',
        function($q, $timeout, $rootScope) {

            function News() {

                this.request = require('request');

                this.redditDeferred = $q.defer();
                this.redditPosts = {
                    items: []
                };

                this.announcementsDeferred = $q.defer();
                this.announcements = {
                    items: []
                };

                this.reddcoinDeferred = $q.defer();
                this.reddcoinPosts = {
                    items: []
                };

                this.getNew();
            }

            News.prototype = {

                getNew: function () {
                    this.loadRedditPosts();
                    this.loadAnnouncements();
                    this.loadReddcoinPosts();
                },

                getRedditPosts: function () {
                    return this.redditDeferred.promise;
                },

                loadRedditPosts: function () {
                    var self = this;

                    this.request(
                        {
                            uri: 'http://www.reddit.com/r/reddcoin/new.json?sort=new',
                            json: true
                        },
                        function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                var posts = body.data.children;

                                posts.forEach(function (post) {
                                    post.data.timestamp = post.data.created_utc * 1000;
                                    post.data.html_content = _.unescape(post.data.selftext_html);
                                    post.data.html_content_text = _.unescape(nl2br(post.data.selftext));
                                });

                                $timeout(function() {
                                    self.redditPosts.items = posts;
                                    self.redditDeferred.resolve(self.redditPosts);
                                });
                            } else {
                                self.redditDeferred.reject(error, response);
                            }
                        }
                    );

                    return self.redditDeferred.promise;
                },

                getAnnouncements: function () {
                    return this.announcementsDeferred.promise;
                },

                loadAnnouncements: function () {
                    var self = this;

                    try {
                        var FeedParser = require('feedparser');
                    } catch (error) {
                        self.announcementsDeferred.reject(error);
                        console.log(error);

                        return self.announcementsDeferred.promise;
                    }

                    var request = require('request');

                    var req = request('https://script.google.com/macros/s/AKfycbz6OV1n3Ecg9fpyfFM-G0yFv2uXMK3RP6JWo1LwFIUgv4TYPTa-/exec?476019641790132225');
                    var feedparser = new FeedParser({
                        normalize: true
                    });

                    req.on('error', function (error) {
                        self.announcementsDeferred.reject(error);
                        console.log(error);
                    });

                    req.on('response', function (res) {
                        var stream = this;

                        if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

                        stream.pipe(feedparser);
                    });


                    feedparser.on('error', function(error) {
                        self.announcementsDeferred.reject(error);
                        console.log(error);
                    });

                    var posts = 0;
                    var first = true;

                    feedparser.on('readable', function() {

                        var stream = this;
                        var meta = this.meta;
                        var item;

                        posts++;

                        if (first) {
                            self.announcements.items = [];
                            first = false;
                        }

                        while (item = stream.read()) {
                            self.announcements.items.push({
                                data: {
                                    title: item.title,
                                    author: '@reddcoin',
                                    timestamp: item['rss:pubdate']['#'],
                                    url: item.permalink,
                                    html_content_text: item.summary
                                }
                            });
                        }

                        if (posts == 20) {
                            $timeout(function() {
                                self.announcementsDeferred.resolve(self.announcements);
                            });
                        }
                    });

                    return self.announcementsDeferred.promise;
                },

                getReddcoinPosts: function () {
                    return this.reddcoinDeferred.promise;
                },

                loadReddcoinPosts: function () {
                    var self = this;

                    try {
                        var FeedParser = require('feedparser');
                    } catch (error) {
                        self.reddcoinDeferred.reject(error);
                        console.log(error);

                        return self.reddcoinDeferred.promise;
                    }

                    var request = require('request');

                    var req = request('https://script.google.com/macros/s/AKfycbz6OV1n3Ecg9fpyfFM-G0yFv2uXMK3RP6JWo1LwFIUgv4TYPTa-/exec?476020034972577792');
                    var feedparser = new FeedParser({
                        normalize: true
                    });

                    req.on('error', function (error) {
                        self.reddcoinDeferred.reject(error);
                        console.log(error);
                    });

                    req.on('response', function (res) {
                        var stream = this;

                        if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

                        stream.pipe(feedparser);
                    });


                    feedparser.on('error', function(error) {
                        self.reddcoinDeferred.reject(error);
                        console.log(error);
                    });

                    var posts = 0;
                    var first = true;

                    feedparser.on('readable', function() {

                        var stream = this;
                        var meta = this.meta;
                        var item;

                        posts++;

                        if (first) {
                            self.reddcoinPosts.items = [];
                            first = false;
                        }

                        while (item = stream.read()) {
                            self.reddcoinPosts.items.push({
                                data: {
                                    title: item.title,
                                    author: '#reddcoin',
                                    timestamp: item['rss:pubdate']['#'],
                                    url: item.permalink,
                                    html_content_text: item.summary
                                }
                            });
                        }

                        if (posts == 15) {
                            $timeout(function() {
                                self.reddcoinDeferred.resolve(self.reddcoinPosts);
                            });
                        }
                    });

                    return self.reddcoinDeferred.promise;
                }

            };

            return new News();

        }

    ]
);