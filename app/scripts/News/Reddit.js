App.Irc.factory('Reddit',
    [
        '$q',
        '$timeout',
        '$rootScope',
        function($q, $timeout, $rootScope) {

            function Reddit() {

                this.request = require('request');
                this.posts = [];

                this.getPosts();

            }

            Reddit.prototype = {

                getPosts: function () {
                    var self = this;
                    var deferred = $q.defer();

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
                                });

                                self.posts = posts;
                                deferred.resolve(self.posts);
                            } else {
                                deferred.reject(error, response);
                            }
                        }
                    );

                    return deferred.promise;
                }

            };

            return new Reddit();

        }

    ]
);