App.Wallet.ConfigModel = (function () {

    function Model() {

        this.defaultConfig = {

            "debug": false,

            "localDaemon": {

                // Whether the local daemon is enabled or not.
                "enabled": true,

                // Specify the full path to the data directory. Default: $APP
                // Note: If you are running windows, use double slash (\\) Eg: "C:\\reddcoin-datadir"
                "directory": "$APP",

                // The seconds at which the wallet retrieves data from the daemon
                // Note: The local daemon can receive events from the daemon, so this does not matter too much.
                "pollInterval": 10

            },

            // Remote Daemon Configuration [NOT CURRENTLY ACTIVE]
            // Note: Do not enable both daemon configurations at the same time
            "remoteDaemon": {

                "enabled": false,

                "hostname": "127.0.0.1",
                "port": 45445,

                "username": "username",
                "password": "password",

                "pollInterval": 10 // The seconds at which the wallet retrieves data from the daemon

            }

        };

    }

    Model.prototype.merge = function (config) {
        this.config = _.merge(_.cloneDeep(this.defaultConfig), config);
    };

    return Model;

}());
