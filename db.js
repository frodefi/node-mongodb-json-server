// Database related
'use strict';

var MongoClient       = require('mongodb').MongoClient;
var BSON              = require('mongodb').BSONPure;
var ObjectID          = require('mongodb').ObjectID;
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
var util          = require('util');

var DbProvider = function(host, port, database) {
  var dbUrl = "mongodb://"+host+":"+port+"/"+database;
  var self = this;
  MongoClient.connect(dbUrl, function(err, db) {
    self.db = db;
  });
};

// Generalized function to operations on the database
// Todo: Generalize even more when user authenication is implemented
DbProvider.prototype.doOperation = function(collection, operation, params, callback) {
  var operationCallback = function(err, result) {
    if (result._id) { // '_id' is mongodb specific, lets convert to the more general 'id'
      result.id = result._id;
      delete result._id;
    }
    callback(err, result)
  };
  this.db.collection(collection, function(err, collection) {
    //todo: move this check into a general params validator
    if (params.id) { // 'id' is used by the program that uses this module
      if(checkForHexRegExp.test(params.id)) {
        params._id = new BSON.ObjectID(params.id); // '_id' is mongodb way of naming the id.
        delete params.id;
      } else {
        err = {error: 'Wrong ID format'};
      }
    }
    if(err) callback(err)
    else {
      if(operation==='find') {
        collection.find().toArray(operationCallback);
      } else {
        collection[operation](params, operationCallback);
      }
    }
  });
}

DbProvider.prototype.findAllNotes = function(params, callback) {
  this.doOperation('notes', 'find', params, callback);
};

DbProvider.prototype.findNoteById = function(params, callback) {
  this.doOperation('notes', 'findOne', params, callback);
};

DbProvider.prototype.saveNote = function(params, callback) {
  params.created_at = new Date();
  var validates = true; // todo: Should do some validation, for now just let anything be ok
  validates ? this.doOperation('notes', 'save', params, callback) : callback({"error": "saveNote validation error"});
};

DbProvider.prototype.deleteNote = function(params, callback) {
  var validates = true; // todo: Should really do validation here too...
  validates ? this.doOperation('notes', 'remove', params, callback) : callback({"error": "deleteNote validation error"});
};

DbProvider.prototype.findUser = function(params, callback) {
  console.log('--------- params:' + util.inspect(params));
  this.doOperation('users', 'findOne', params, callback);
};

exports.DbProvider = DbProvider;
