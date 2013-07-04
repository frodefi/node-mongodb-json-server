// Database related
'use strict';

var MongoClient       = require('mongodb').MongoClient;
var BSON              = require('mongodb').BSONPure;
var ObjectID          = require('mongodb').ObjectID;
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
var Validator         = require('validator').Validator;
var fieldMaxLength    = 1024;
//var util              = require('util');

var DbProvider = function(uri) {
  this.dbUri = uri;
};

DbProvider.prototype.connect = function(callback) {
  var self = this;
  MongoClient.connect(this.dbUri, function(err, db) {
    self.db = db;
    callback();
  });
};

// Do some basic validation on the data we get from the client/user
DbProvider.prototype.validateParams = function(params, callback) {
  // Let´ do a quick general sanity check on the length on all fields
  for(var key in params) {
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
  // todo: add some more fields to check...
  if(err) callback(err);
}

// Generalized function to do operations on the database
DbProvider.prototype.doOperation = function(collection, operation, params, callback) {
  this.validateParams(params, callback);
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
  this.doOperation('users', 'find', params, callback);
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
