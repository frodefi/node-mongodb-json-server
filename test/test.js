var DbProvider = require('../db').DbProvider;
var assert     = require('assert');
var dbProvider = new DbProvider(
  process.env.mongo_host       || 'localhost',
  process.env.mongo_port       || 27017,
  process.env.mongo_db         || 'nki'
);

describe('DbProvider', function(){
/*
  beforeEach(function(){

  })
*/
  describe('findAllNotes', function(){
    it('should return some notes', function(){
      dbProvider.findAllNotes({}, function (err, result){
        assert(result.length > 0);
      });
    })
  })
})