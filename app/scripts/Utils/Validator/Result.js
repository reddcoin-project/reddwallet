App.Utils.ValidatorResult = (function () {

    function Result () {
        this.success = false;
        this.messages = [];
    }

    Result.prototype = {

        isSuccessful: function () {
            return this.success;
        },

        getMessages: function () {
            return this.messages;
        }

    };

    return Result;

});
