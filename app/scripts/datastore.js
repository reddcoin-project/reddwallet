var DataStore, createDocumentStore, createRelationalStore, createSimpleStore;

DataStore = (typeof exports !== "undefined" && exports !== null) && exports || (this.DataStore = {});

DataStore.create = function(type) {
    switch (type) {
        case "simple":
            return createSimpleStore();
        case "relational":
            return createRelationalStore();
        case "document":
            return createDocumentStore();
        default:
            return void 0;
    }
};

createSimpleStore = function() {
    return {
        get: function(key) {
            return JSON.parse(localStorage.getItem(JSON.stringify(key)));
        },
        set: function(key, value) {
            return localStorage.setItem(JSON.stringify(key), JSON.stringify(value));
        },
        "delete": function(key) {
            return localStorage.removeItem(JSON.stringify(key));
        },
        count: function() {
            return localStorage.length;
        },
        clear: function() {
            return localStorage.clear();
        }
    };
};

createRelationalStore = function() {
    var db, store;
    db = openDatabase("nwsqldb", "1.0", "embedded sql database", 1024 * 1024 * 256);
    store = {
        run: function(query, fn) {
            return db.transaction(function(tx) {
                return tx.executeSql(query, [], function(tx, result) {
                    var i;
                    return typeof fn === "function" ? fn((function() {
                        var _i, _ref, _results;
                        _results = [];
                        for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                            _results.push(result.rows.item(i));
                        }
                        return _results;
                    })()) : void 0;
                });
            });
        }
    };
    return store;
};

createDocumentStore = function() {
    var NeDB, datapath, e, store;
    try {
        NeDB = require("nedb");
        datapath = require('nw.gui').App.dataPath + "/nedb";
        store = {
            collection: function(name) {
                return new NeDB({
                    filename: "/" + name,
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