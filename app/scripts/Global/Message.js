App.Global.Message = (function () {

    /**
     *
     * @param result
     * @param code
     * @param message
     * @param extra
     * @constructor
     */
    function Message (result, code, message, extra) {
        this.result = result;
        this.message = message;
        this.code = code;

        // When its an RPC message
        this.rpcInfo = {};
        this.rpcError = {};

        // When its an DB message
        this.dbError = {};
        this.dbModel = {};

        this.model = {};

        if (extra != undefined) {
            for (var key in extra) {
                if (!extra.hasOwnProperty(key)) continue;
                this[key] = extra[key];
            }
        }
    }

    Message.prototype = {

        // Stuff

    };

    return Message;

}());

/*
 Error Codes
 ===========

-1 : Unknown Error
 0 : No Error
 1 : The operating system running the application does not have a supported reddcoind daemon.
 2 : The daemon for the selected operating system cannot be find, most likely a file path issue or
     was failed to be bundled with the wallet.
 3 : There was an error sending the command to the daemon. See the rpc error for more details.
 4 : There was an error initializing the daemon.
 5 : NeDB error, see dbError for more details.
*/
