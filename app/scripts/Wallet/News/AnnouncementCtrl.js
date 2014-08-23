App.Wallet.controller(
    'AnnouncementCtrl',
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
            $scope.loaded = false;
            $scope.postData = [];
            $scope.refreshNews = function () {
                $timeout(function() {
                    $scope.loaded = false;

                    News.loadAnnouncements();

                    var announcementDeferred = News.getAnnouncements();

                    if (announcementDeferred.then == undefined) {
                        $scope.postData = announcementDeferred;
                        $scope.loaded = true;
                    } else {
                        announcementDeferred.then(
                            function success(announcements) {
                                $scope.postData = announcements;
                                $scope.loaded = true;
                            },
                            function error() {
                                $scope.loaded = true;
                                $scope.postData = { items: [
                                    {
                                        data: {
                                            title: "An error occurred whilst loading the announcements."
                                        }
                                    }
                                ]};
                            }
                        );
                    }
                });

                if ($scope.hasRun) {
                    $timeout(function () {
                        $alert({
                            "title": "Announcement",
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

            $scope.openPost = function ($index) {
                var post = $scope.postData.items[$index];

                if (post.data.url == undefined || post.data.url == null) {
                    return; // Do nothing
                }

                require('nw.gui').Shell.openExternal(post.data.url);
            }

        }
    ]
);