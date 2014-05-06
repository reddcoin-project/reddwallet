App.Utils.Validator = (function () {

    function Validator () {

    }

    Validator.prototype = {

        /**
         * @returns {App.Utils.ValidatorResult}
         */
        validate: function (rules, data) {
            var result = new App.Utils.ValidatorResult();

            for (var key in rules) {
                if (!rules.hasOwnProperty(key)) {
                    continue;
                }


            }

            return result;
        }

    };

    return Validator;

});