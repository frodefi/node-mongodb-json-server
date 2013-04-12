var util       = require('util');
var should     = require('should');
var app        = require('../server').app;
var superagent = require('superagent');

describe('/logout', function() {
  var agent = superagent.agent();
  it('should reply logged out, (for now) even if no user was logged in', function(done) {
    agent.get('http://127.0.0.1:8080/logout').end(function(err, res) {
//      console.log('err:' + util.inspect(err));
//      console.log('res:' + util.inspect(res));
      res.should.have.status(200);
      res.text.should.include('Logged out');
      return done();
    });
  });
});
