App.Wallet.controller(
    'NewsCtrl',
    [
        '$scope',
        '$timeout',
        '$alert',
        'News',
        function ($scope, $timeout, $alert, News) {

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

            $scope.refreshNews = function () {
                $timeout(function() {

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
                        $scope.reload();
                    } else {
                        redditDeferred['top'].then(function(news) {
                            $scope.content['reddit-top'] = news;
                            $scope.reload();
                        });
                    }

                    if (redditDeferred['new'].then == undefined) {
                        $scope.content['reddit-new'] = redditDeferred['new'];
                        $scope.reload();
                    } else {
                        redditDeferred['new'].then(function(news) {
                            $scope.content['reddit-new'] = news;
                            $scope.reload();
                        });
                    }

                    var reddcoinDeferred = News.getReddcoinPosts();

                    if (reddcoinDeferred.then == undefined) {
                        $scope.content.reddcoin = reddcoinDeferred;
                        $scope.reload();
                    } else {
                        reddcoinDeferred.then(function(reddcoinPosts) {
                            $scope.content.reddcoin = reddcoinPosts;
                            $scope.reload();
                        });
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