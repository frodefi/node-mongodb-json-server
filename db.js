// Database related
'use strict';

var MongoClient       = require('mongodb').MongoClient;
var BSON              = require('mongodb').BSONPure;
var ObjectID          = require('mongodb').ObjectID;
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
var Validator         = require('validator').Validator
var fieldMaxLength    = 1024;
//var util              = require('util');

var DbProvider = function(host, port, database) {
  var dbUrl = "mongodb://"+host+":"+port+"/"+database;
  var self = this;
  MongoClient.connect(dbUrl, function(err, db) {
    self.db = db;
  });
};

// Do some basic validation on the data we get from the client/user
var validateParams = function(params, callback) {
  // Let´ do a quick general sanity check on the length on all fields
  for(var key in params) {
    console.log('-------' + key);
    if(params[key].length > fieldMaxLength) callback(new Error('Field ' + key + ' is too long.'));
  }
  // and the let us check some specific fields better
  if (params._id) {
    if(checkForHexRegExp.test(params._id)) {
      // In case of '_id' we also need to convert it to BSON so that mongodb can use it.
      params._id = new BSON.ObjectID(params._id);
    } else {
      var err = {error: 'Wrong ID format'};
    }
  }
  if(err) callback(err);
}

// Generalized function to operations on the database
// Todo: Generalize even more when user authenication is implemented
DbProvider.prototype.doOperation = function(collection, operation, params, callback) {
  validateParams(params, callback);
  var operationCallback = function(err, result) {
    callback(err, result);
  };
  this.db.collection(collection, function(err, collection) {
    if(operation==='find') {
      collection.find().toArray(operationCallback);
    } else {
      collection[operation](params, operationCallback);
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
  this.doOperation('notes', 'save', params, callback);
};

DbProvider.prototype.deleteNote = function(params, callback) {
  this.doOperation('notes', 'remove', params, callback);
};

DbProvider.prototype.findUser = function(params, callback) {
  this.doOperation('users', 'findOne', params, callback);
};

exports.DbProvider = DbProvider;
