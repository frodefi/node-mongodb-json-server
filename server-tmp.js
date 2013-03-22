'use strict';

var express       = require('express');
var app           = express();
var DbProvider    = require('./db').DbProvider;
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var port          = process.env.express_port || 8080;
var util          = require('util');

// For Passport
passport.serializeUser(function(user, done) {
  console.log("------ user:" + util.inspect(user));
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log("------ id:" + id);
  dbProvider.findUser({id: id}, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log('using:'+ username + '/' + password);
    // asynchronous verification, for effect...
    process.nextTick(function () {
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      dbProvider.findUser({username: username, password: password}, function(err, user) {
        console.log("User:"+util.inspect(user));
        if (err) { console.log("err"); return done(err); }
        if (!user) { console.log("!User"); return done(null, false, { message: 'Unknown user/password combination'}); }
        console.log("else");
        return done(null, user);
      });
    });
  }
));

app.configure(function () {
//  app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
  app.use(express.bodyParser());
//app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'I do not use underwear' }));
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
  process.env.mongo_db         || 'nki'
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

//   curl -i -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post(
  '/login',
  function(req, res, next) {
    console.log('before authenticate:' + req.cookies.httpbasic + ':' + req.body.username+ ':' + req.body.password);
    passport.authenticate('local', function(err, user, info) {
      console.log('authenticate callback');
      console.log("------ ac user:" + util.inspect(user));
      console.log("------ info:" + util.inspect(info));
      if (err) { return res.send({status:'err',message:err.message}); }
      if (!user) { return res.send({status:'fail',message:info.message}); }
      req.logIn(user, function(err) {
        console.log('hmmmmmmm');
        if (err) { return res.send({status:'erro',message:err.message}); }
        return res.send({status:'ok', message: 'no message'});
      });
    })(req, res, next);
  },
  function(err, req, res, next) {
    console.log('failure');
    // failure in login test route
    return res.send({'status':'err','rrrmessage':err.message});
  }
);

/*
app.post('/login',
  passport.authenticate('local', res.json({error: 'Not logged in'});),
  function(req, res) { res.json({result: 'logged in'}); }
);
*/

app.get('/logout', function(req, res){
  req.logout();
  res.json({result: 'Logged out'});
});

app.listen(port, function() {
  console.log('Express listening at %s', port);
});

function ensureAuthenticated(req, res, next) {
  console.log('Heeeeey');
  if (req.isAuthenticated()) { console.log('Hooooommmmmooooooo'); return next(); } else {console.log('fitte')}
  console.log('Hoooooo');
  res.json({error: 'Not logged in'});
}

process.on('uncaughtException', function (err) {
  console.log( "UNCAUGHT EXCEPTION " );
  console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});
