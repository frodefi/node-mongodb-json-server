'use strict';

var express       = require('express');
var app           = express();
var DbProvider    = require('./db').DbProvider;
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var port          = process.env.express_port || 8080;
//var util          = require('util');

exports.app       = app;

// For Passport
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  dbProvider.findUser({_id: id}, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    process.nextTick(function () {
      dbProvider.findUser({username: username, password: password}, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { error: 'Unknown user/password combination'}); }
        return done(null, user);
      });
    });
  }
));

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'I don´t use underwear on causal friday', cookie: {maxAge: 2 * 7 * 24 * 60 * 60 * 1000} }));
  app.use(passport.initialize());
  app.use(passport.session());
});

/*
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});
*/

// Setup db instance
var dbProvider = new DbProvider(
  process.env.mongo_host       || 'localhost',
  process.env.mongo_port       || 27017,
  process.env.mongo_db         || 'nki'
);
// Connect to db. I use (for now) 1 connection for the lifetime of this app
// And we do not use the a callback when connection here (we do in the testing)
dbProvider.connect(function(){});

// curl -i -c cookie.txt -d "username=bob&password=secret" http://127.0.0.1:3000/login
// Curl need -c cookie.txt to be able to store a cookie so we can stay logged in
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return res.json({error: err.message}); }
    if (!user) { return res.json({error: 'User and/or password not correct'}); }
    req.logIn(user, function(err) {
      if (err) { return res.json({error: err.message}); }
      return res.json({result: 'logged in'});
    });
  })(req, res, next);
});

app.get('/logout', function(req, res){
  req.logout();
  res.json({result: 'Logged out'});
});

// Generalized function for what to do with a request (it is all interactions with the database)
var doOperation = function(operation) {
  return function(req, res) {
    dbProvider[operation](req.params, function (err, result){
      return err ? res.send(err) : res.json(result);
    });
  }
};

// Find all notes, like:
// curl -i -b cookie.txt http://localhost:8080/get
app.get('/get',        ensureAuthenticated, doOperation('findAllNotes'));

// Find note by id, like:
// curl -i -b cookie.txt http://localhost:8080/get/id/51374299e669481c48a25c8c
app.get('/get/:id',    ensureAuthenticated, doOperation('findNoteById'));

// Create new note, like:
// curl -i -b cookie.txt -X POST -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich!"' http://localhost:8080/new
app.post('/new',       ensureAuthenticated, doOperation('saveNote'));

// Update note, like:
// curl -i -b cookie.txt -X PUT -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich, quickly!"}' http://localhost:8080/update/5137d133d97331afb8000001
app.put('/update/:id', ensureAuthenticated, doOperation('saveNote'));

// curl -i -b cookie.txt -X DELETE http://localhost:8080/delete/51374299e669481c48a25c8c
app.del('/delete/:id', ensureAuthenticated, doOperation('deleteNote'));

app.listen(port, function() {
  console.log('Express listening at %s', port);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.json({error: 'Not logged in'});
}

process.on('uncaughtException', function (err) {
  console.log( "UNCAUGHT EXCEPTION " );
  console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});
