// Database related
'use strict';

var MongoClient       = require('mongodb').MongoClient;
var BSON              = require('mongodb').BSONPure;
var ObjectID          = require('mongodb').ObjectID;
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

var NoteProvider = function(host, port, database, collectionName) { // , username, password
  var dbUrl = "mongodb://"+host+":"+port+"/"+database;
  var self = this;
  MongoClient.connect(dbUrl, function(err, db) {
    self.db = db;
  });
  this.collectionName = collectionName;
};

// Generalized function to operations on the database
// Todo: Generalize even more when user authenication is implemented
NoteProvider.prototype.doOperation = function(operation, note, callback) {
  var operationCallback = function(err, result) { callback(err, result) };
  this.db.collection(this.collectionName, function(err, collection) {
    //todo: move this check into a general note validator
    if (note._id) {
      if(checkForHexRegExp.test(note._id)) {
        note._id = new BSON.ObjectID(note._id);
      } else {
        err = {error: 'Wrong ID format'};
      }
    }
    if(err) callback(err)
    else {
      if(operation==='find') {
        collection.find().toArray(operationCallback);
      } else {
        collection[operation](note, operationCallback);
      }
    }
  });
}

NoteProvider.prototype.findAllNotes = function(note, callback) {
  this.doOperation('find', note, callback);
};

NoteProvider.prototype.findNoteById = function(note, callback) {
  this.doOperation('findOne', note, callback);
};

NoteProvider.prototype.saveNote = function(note, callback) {
  note.created_at = new Date();
  var validates = true; // todo: Should do some validation, for now just let anything be ok
  validates ? this.doOperation('save', note, callback) : callback({"error": "saveNote validation error"});
};

NoteProvider.prototype.deleteNote = function(note, callback) {
  var validates = true; // todo: Should really do validation here too...
  validates ? this.doOperation('remove', note, callback) : callback({"error": "deleteNote validation error"});
};

exports.NoteProvider = NoteProvider;
