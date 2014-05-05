App.Global.Message = (function () {

    /**
     * A rigid message object used to pass data around.
     *
     * @param result
     * @param message
     * @param code
     * @param extra
     * @constructor
     */
    function Message (result, code, message, extra) {
        this.result = result;
        this.message = message;
        this.code = code;

        if (extra != undefined) {
            for (var key in extra) {
                if (!extra.hasOwnProperty(key)) continue;
                this[key] = extra[key];
            }
        }
    }

    Message.prototype = {



    };

    return Message;

}());

/*
 Error Codes
 ===========

-1 : Unknown Error
 0 : No Error
 1 : The operating system running the application does not have a supported reddcoind daemon.
 2 : The deamon for the selected operating system cannot be find, most likely a file path issue or
     was failed to be bundled with the wallet.
 3 : There was an error sending an transaction. See the rpc error for more details.


*/
