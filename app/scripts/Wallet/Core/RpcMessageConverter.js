function rpcCodeToMessage (code) {

    var codeMap = {

        // Standard JSON-RPC 2.0 Errors

        '-32600': {
            label: 'RPC_INVALID_REQUEST',
            description: 'Invalid Request (JSON-RPC 2.0 Error)'
        },

        '-32601': {
            label: 'RPC_METHOD_NOT_FOUND',
            description: 'Method Not Found (JSON-RPC 2.0 Error)'
        },

        '-32602': {
            label: 'RPC_INVALID_PARAMS',
            description: 'Invalid Parameters (JSON-RPC 2.0 Error)'
        },

        '-32603': {
            label: 'RPC_INTERNAL_ERROR',
            description: 'Internal Error (JSON-RPC 2.0 Error)'
        },

        '-32700': {
            label: 'RPC_PARSE_ERROR',
            description: 'Parse Error (JSON-RPC 2.0 Error)'
        },

        // General application defined errors

        '-1': {
            label: 'RPC_MISC_ERROR',
            description: 'Unknown error in command handling.'
        },

        '-2': {
            label: 'RPC_FORBIDDEN_BY_SAFE_MODE',
            description: 'Server is in safe mode, command not allowed.'
        },

        '-3': {
            label: 'RPC_TYPE_ERROR',
            description: 'Unexpected type was passed as a parameter.'
        },

        '-5': {
            label: 'RPC_INVALID_ADDRESS_OR_KEY',
            description: 'Invalid address/key.'
        },

        '-7': {
            label: 'RPC_OUT_OF_MEMORY',
            description: 'Ran out of memory during operation.'
        },

        '-8': {
            label: 'RPC_INVALID_PARAMETER',
            description: 'Invalid, missing or duplicate parameter.'
        },

        '-20': {
            label: 'RPC_DATABASE_ERROR',
            description: 'Database Error.'
        },

        '-22': {
            label: 'RPC_DESERIALIZATION_ERROR',
            description: 'Error parsing or validating structure in raw format.'
        },

        '-25': {
            label: 'RPC_TRANSACTION_ERROR',
            description: 'Error during transaction submission.'
        },

        '-26': {
            label: 'RPC_TRANSACTION_REJECTED',
            description: 'Transaction was rejected by network rules.'
        },

        '-27': {
            label: 'RPC_TRANSACTION_ALREADY_IN_CHAIN',
            description: 'The transaction is already in the chain.'
        },

        // P2P Client errors

        '-9': {
            label: 'RPC_CLIENT_NOT_CONNECTED',
            description: 'Reddcoin is not connected to the network.'
        },

        '-10': {
            label: 'RPC_CLIENT_IN_INITIAL_DOWNLOAD',
            description: 'Still downloading initial blocks.'
        },

        '-23': {
            label: 'RPC_CLIENT_NODE_ALREADY_ADDED',
            description: 'Node is already added.'
        },

        '-24': {
            label: 'RPC_CLIENT_NODE_NOT_ADDED',
            description: 'Node has not been added before.'
        },

        // Wallet errors

        '-4': {
            label: 'RPC_WALLET_ERROR',
            description: 'An unknown error occurred with the wallet.'
        },

        '-6': {
            label: 'RPC_WALLET_INSUFFICIENT_FUNDS',
            description: 'Insufficient funds within the wallet.'
        },

        '-11': {
            label: 'RPC_WALLET_INVALID_ACCOUNT_NAME',
            description: 'Invalid account name.'
        },

        '-12': {
            label: 'RPC_WALLET_KEYPOOL_RAN_OUT',
            description: 'Keypool ran out, call \'keypoolrefill\' first.'
        },

        '-13': {
            label: 'RPC_WALLET_UNLOCK_NEEDED',
            description: 'The wallet pasphrase is required for this operation.'
        },

        '-14': {
            label: 'RPC_WALLET_PASSPHRASE_INCORRECT',
            description: 'The passphrase given is incorrect.'
        },

        '-15': {
            label: 'RPC_WALLET_WRONG_ENC_STATE',
            description: 'Wallet is in the wrong encryption state for this command.'
        },

        '-16': {
            label: 'RPC_WALLET_ENCRYPTION_FAILED',
            description: 'Wallet encryption failed.'
        },

        '-17': {
            label: 'RPC_WALLET_ALREADY_UNLOCKED',
            description: 'Wallet is already unlocked.'
        }

    };

    if (codeMap[code.toString()].description == undefined) {
        return "Unknown code " + code;
    }

    return codeMap[code.toString()].description;

}