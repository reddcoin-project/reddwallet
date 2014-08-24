App.Wallet.ConfigParser = (function () {

    function ConfigParser() {
        this.walletConfig = null;
        this.walletConfigPath = nwGui.App.dataPath + "/config.json";
    }

    ConfigParser.prototype = {

        retrieveConfig: function () {
            this.initializeConfig();
            this.parseConfig();
            this.mergeConfig();
        },

        /**
         * @returns App.Wallet.ConfigModel
         */
        getConfig: function () {
            if (this.walletConfig == null) {
                this.retrieveConfig();
            }

            return this.walletConfig;
        },

        initializeConfig: function () {
            try {

                if (!nodeFs.existsSync(this.walletConfigPath)) {
                    var defaultWalletConf = nodeFs.readFileSync('config.json', {
                        encoding: 'utf8'
                    });

                    nodeFs.writeFileSync(this.walletConfigPath, defaultWalletConf);
                }

            } catch (ex) {
                console.log("An error occurred whilst initializing the wallet configuration. " + ex);
            }
        },

        parseConfig: function () {
            try {

                var stripJsonComments = require('strip-json-comments');

                var walletConf = nodeFs.readFileSync(this.walletConfigPath, {
                    encoding: 'utf8'
                });

                this.walletConfig = JSON.parse(stripJsonComments(walletConf));

            } catch (ex) {
                console.log("An error occurred whilst parsing the wallet configuration. " + ex);
            }
        },

        mergeConfig: function () {
            var configModel = new App.Wallet.ConfigModel();

            configModel.merge(this.walletConfig);

            this.walletConfig = configModel;
        }

    };

    return ConfigParser;

}());