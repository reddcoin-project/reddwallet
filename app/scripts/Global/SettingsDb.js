App.Global.factory('settingsDb',
    [
        '$q',
        '$timeout',
        '$rootScope',
        function ($q, $timeout, $rootScope) {


            var DbModel = function ($q, $timeout, $rootScope) {

                this.$q = $q;
                this.$timeout = $timeout;
                this.$rootScope = $rootScope;

                this.settings = App.Global.NeDB.collection('settings');
                this.settings.ensureIndex({
                    fieldName: 'key',
                    unique: true
                });

            };

            DbModel.prototype = {

                getValue: function (key) {
                    var self = this;
                    var deferred = self.$q.defer();

                    this.settings.findOne({ key: key }, function (err, setting) {
                        if (err != null || setting == null || setting.key == undefined) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve(setting);
                        }
                    });

                    return deferred.promise;
                },

                setValue: function (key, newValue) {
                    var self = this;
                    var deferred = self.$q.defer();

                    var newSetting = {
                        key: key,
                        value: newValue
                    };

                    this.settings.update(
                        { key: newSetting.key }, // Limit (query)
                        newSetting, // New setting
                        { upsert: true }, // Insert as a new document if it does not exist
                        function (err, numReplaced, newSetting) {
                            if (err == null) {
                                deferred.resolve(newSetting, numReplaced);
                            } else {
                                deferred.reject(err);
                            }
                        }
                    );

                    return deferred.promise;
                }


            };

            return new DbModel($q, $timeout, $rootScope);
        }

    ]
);