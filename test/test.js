var util       = require('util');
var assert     = require('assert');
var DbProvider = require('../db').DbProvider;
var dbProvider = new DbProvider('localhost', 27017, 'nki');

// Just testing testing, much more to come...
describe('DbProvider', function(){
  describe('findAllNotes', function(){
    it('should return some notes', function(done){
      dbProvider.connect(function(){
        dbProvider.findAllNotes({}, function (err, result){
          assert(result.length > 0);
          done();
        });
      });
    })
  })
})
