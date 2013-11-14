'use strict';
// Really just testing testing, more to come...
describe('DbProvider', function(){
  var util       = require('util');
  var async      = require('async');
  var assert     = require('assert');
  var DbProvider = require('../db').DbProvider;
  var dbProvider = new DbProvider('localhost', 27017, 'test');
  var fixtures   = [
    {
      url: 'www.nytimes.com',
      title: 'The New York Times',
      description: 'Newspaper',
      tags: 'news "New York"'
    },
    {
      url: 'digi.no',
      title: 'Digi',
      description: 'ITnyheter',
      tags: 'news it norway'
    }
  ];
  console.log("Array:" + Array.isArray(fixtures));
  before(function(done){ // Connect to the test-database
    dbProvider.connect(function(){
      console.log('1');
      done();
    });
  });
  before(function(done){ // Make the note-collection empty
    dbProvider.deleteNote({},function(){
      console.log('1.4');
      done();
    });
/*
    var end = Date.now() + 1000;
    while (Date.now() < end) ;
    console.log('1.5');
*/
  });
  before(function(done){
    console.log('1.6.1:' + util.inspect(fixtures[0]));
    dbProvider.saveNote(fixtures[0],function(){
      done();
    });
  });
  before(function(done){
    console.log('1.6.1:' + util.inspect(fixtures[1]));
    dbProvider.saveNote(fixtures[1],function(){
      done();
    });
  });
/*
  for(var i in fixtures) {  // Insert data sample
    console.log('1.6:' + i + ':' + util.inspect(fixtures[i]));
    before(function(done){
      console.log('1.6.5:' + i + ':' + util.inspect(fixtures[i]));
      dbProvider.saveNote(fixtures[i],function(){
        done();
      });
    });
  }
*/
  describe('findAllNotes', function(){
    it('should return some 0 notes', function(done){
      console.log('2');
      dbProvider.findAllNotes({}, function (err, result){
        console.log('3');
        assert.equal(result.length,2);
        done();
      });
    });
  });
  describe('saveNote', function(){
    it('should insert a note without error', function(done){
      console.log('4');
      dbProvider.saveNote({}, function (err, result){
        console.log('5');
        assert.equal(err,null);
        done();
      });
    });
  });
});
