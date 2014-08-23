App.Wallet.controller(
    'NewsCtrl',
    [
        '$scope',
        '$timeout',
        '$alert',
        'News',
        function ($scope, $timeout, $alert, News) {

            // Handle the external URL's
            var window = require('nw.gui').Window.get();
            window.on('new-win-policy', function (frame, url, policy) {
                require('nw.gui').Shell.openExternal(url);
                policy.ignore();
            });

            $scope.hasRun = false;

            $scope.activePage = 'reddit-top';

            $scope.content = {
                'reddit-top': [],
                'reddit-new': [],
                'reddcoin': []
            };

            $scope.changePage = function(page) {
                $scope.activePage = page;
                $scope.reload();
            };

            $scope.postData = [];

            $scope.reload = function () {
                $scope.postData = $scope.content[$scope.activePage];
            };

            $scope.resetLoadingScreens = function () {
                $scope.loaded = {
                    'reddit-top': false,
                    'reddit-new': false,
                    'reddcoin': false
                };
            };

            $scope.refreshNews = function () {
                $timeout(function() {
                    $scope.resetLoadingScreens();
                    if ($scope.hasRun) {
                        News.loadRedditPosts('top');
                        News.loadRedditPosts('new');
                        News.loadReddcoinPosts();
                    }

                    var redditDeferred = {
                        'top': News.getRedditPosts('top'),
                        'new': News.getRedditPosts('new')
                    };


                    if (redditDeferred['top'].then == undefined) {
                        $scope.content['reddit-top'] = redditDeferred['top'];
                        $scope.loaded['reddit-top'] = true;
                        $scope.reload();
                    } else {
                        redditDeferred['top'].then(function(news) {
                            $scope.content['reddit-top'] = news;
                            $scope.loaded['reddit-top'] = true;
                            $scope.reload();
                        });
                    }

                    if (redditDeferred['new'].then == undefined) {
                        $scope.content['reddit-new'] = redditDeferred['new'];
                        $scope.loaded['reddit-new'] = true;
                        $scope.reload();
                    } else {
                        redditDeferred['new'].then(function(news) {
                            $scope.content['reddit-new'] = news;
                            $scope.loaded['reddit-new'] = true;
                            $scope.reload();
                        });
                    }

                    var reddcoinDeferred = News.getReddcoinPosts();

                    if (reddcoinDeferred.then == undefined) {
                        $scope.content.reddcoin = reddcoinDeferred;
                        $scope.loaded['reddcoin'] = true;
                        $scope.reload();
                    } else {
                        reddcoinDeferred.then(
                            function success(reddcoinPosts) {
                                $scope.content.reddcoin = reddcoinPosts;
                                $scope.loaded['reddcoin'] = true;
                                $scope.reload();
                            },
                            function error() {
                                $scope.loaded['reddcoin'] = true;
                                $scope.content.reddcoin = { items: [
                                    {
                                        data: {
                                            title: "An error occurred whilst loading the news."
                                        }
                                    }
                                ]};
                                $scope.reload();
                            }
                        );
                    }
                });

                if ($scope.hasRun) {
                    $timeout(function () {
                        $alert({
                            "title": "News",
                            "content": 'Refreshed',
                            "type": "success",
                            duration: 1
                        });
                    });
                } else {
                    $scope.hasRun = true;
                }

            };

            $scope.refreshNews();
            $scope.changePage('reddit-top');

            $scope.openPost = function ($index) {
                var post = $scope.postData.items[$index];

                require('nw.gui').Shell.openExternal(post.data.url);
            }

        }
    ]
);