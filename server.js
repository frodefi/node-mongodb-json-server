'use strict';

var express       = require('express');
var app           = express();
var DbProvider  = require('./db').DbProvider;
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var port          = process.env.express_port || 8080;
//var util          = require('util');

// For Passport
var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  dbProvider.findUserById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    dbProvider.findUserByUsername({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Unknown user' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Invalid password' });
      }
      return done(null, user);
    });
  }
));

app.configure(function () {
//  app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
  app.use(express.bodyParser());
//app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var dbProvider = new DbProvider(
  process.env.mongo_host       || 'localhost',
  process.env.mongo_port       || 27017,
  process.env.mongo_db         || 'nki',
  process.env.mongo_collection || 'notes'
);

// Generalized function for what to do with a request
var doOperation = function(operation) {
  return function(req, res) {
    dbProvider[operation](req.params, function (err, result){
      return err ? res.send(err) : res.json(result);
    });
  }
};

// Find all notes, like:
// curl -i http://localhost:8080/get
app.get('/get', ensureAuthenticated, doOperation('findAllNotes'));

// Find note by id, like:
// curl -i http://localhost:8080/get/id/51374299e669481c48a25c8c
app.get('/get/:id', ensureAuthenticated, doOperation('findNoteById'));


// Create new note, like:
// curl -i -X POST -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich!"' http://localhost:8080/new
app.post('/new', ensureAuthenticated, doOperation('saveNote'));

// Update note, like:
// curl -i -X PUT -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich, quickly!"}' http://localhost:8080/update/5137d133d97331afb8000001
app.put('/update/:id', ensureAuthenticated, doOperation('saveNote'));

// curl -i -X DELETE http://localhost:8080/delete/51374299e669481c48a25c8c
app.del('/delete/:id', ensureAuthenticated, doOperation('deleteNote'));

//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) { res.redirect('/'); }
);
  
app.get('/logout', function(req, res){
  req.logout();
  res.json({result: 'Logged out'});
});

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
