var NeDB, createDocumentStore, createRelationalStore, createSimpleStore;

NeDB = (typeof exports !== "undefined" && exports !== null) && exports || (this.NeDB = {});

NeDB.get = function() {
    var NeDB, datapath, e, store;
    try {
        NeDB = require("nedb");
        datapath = require('nw.gui').App.dataPath + "/nedb";
        store = {
            collection: function(name) {
                return new NeDB({
                    filename: "app/nedb/" + name,
                    autoload: true
                });
            }
        };
        return store;
    } catch (_error) {
        e = _error;
        if (e.code === "MODULE_NOT_FOUND") {
            return console.error("NeDB not found. Try `npm install nedb --save` inside of `/app/assets`.");
        } else {
            return console.error(e);
        }
    }
};