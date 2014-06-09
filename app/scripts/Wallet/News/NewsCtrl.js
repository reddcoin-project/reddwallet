App.Wallet.controller(
    'NewsCtrl',
    [
        '$scope',
        '$timeout',
        '$alert',
        'News',
        function ($scope, $timeout, $alert, News) {

            $scope.hasRun = false;

            $scope.activePage = 'news';

            $scope.content = {
                'news': [],
                'announcement': [],
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
                    var redditDeferred = News.getRedditPosts();

                    if (redditDeferred.then == undefined) {
                        $scope.content.news = redditDeferred;
                        $scope.reload();
                    } else {
                        redditDeferred.then(function(news) {
                            $scope.content.news = news;
                            $scope.reload();
                        });
                    }

                    var announcementDeferred = News.getAnnouncements();

                    if (announcementDeferred.then == undefined) {
                        $scope.content.announcement = announcementDeferred;
                        $scope.reload();
                    } else {
                        announcementDeferred.then(function(announcements) {
                            $scope.content.announcement = announcements;
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
            $scope.changePage('news');

            $scope.openPost = function ($index) {
                var post = $scope.posts[$index];

                require('nw.gui').Shell.openExternal(post.data.url);
            }

        }
    ]
);