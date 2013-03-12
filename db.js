// Database related
'use strict';

var Db                = require('mongodb').Db;
var Connection        = require('mongodb').Connection;
var Server            = require('mongodb').Server;
var BSON              = require('mongodb').BSONPure;
var ObjectID          = require('mongodb').ObjectID;
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
var db;
var collectionName;

var NoteProvider = function(host, port, database, collectionName) { // , username, password
  this.db= new Db(database, new Server(host, port, {auto_reconnect: true}, {}), {w: 1});
  this.db.open(function(){});
  this.collectionName = collectionName;
// Should rewrite the database connection to use the new style with MongoClient, as described in
//  http://mongodb.github.com/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect
};

NoteProvider.prototype.getCollection= function(callback) {
  this.db.collection(this.collectionName, function(err, collection) {
    if( err ) callback(err);
    else callback(null, collection)
  });
};

NoteProvider.prototype.findAll = function(callback) {
  this.getCollection(function(err, collection) {
    if( err ) callback(err);
    else {
      collection.find().toArray(function(err, results) {
        if(err) callback(err);
        else callback(null, results)
      });
    }
  });
};

NoteProvider.prototype.findById = function(id, callback) {
  this.getCollection(function(err, collection) {
    if(!checkForHexRegExp.test(id)) err = {error: 'Wrong ID format'};
    if(err) callback(err);
    else {
      collection.findOne({_id: new BSON.ObjectID(id)}, function(err, result) {
        if(err) callback(err);
        else callback(null, result)
      });
    }
  });
};

NoteProvider.prototype.save = function(id, note, callback) {
  this.getCollection(function(err, collection) {
    if(checkForHexRegExp.test(id)) note[_id] = new BSON.ObjectID(id);
    if(err) callback(err);
    else {
      note.created_at = new Date();
      collection.save(note, function() {
        callback(null, note);
      });
    }
  });
};

NoteProvider.prototype.delete = function(id, callback) {
  this.getCollection(function(err, collection) {
    if(err) callback(err);
    else {
      collection.remove({_id: new BSON.ObjectID(id)}, function(err, result) {
        if(err) callback(err);
        else callback(null, result)
      });
    }
  });
};

exports.NoteProvider = NoteProvider;
