'use strict';

var express       = require('express');
var app           = express();
var DbProvider    = require('./db').DbProvider;
var nodemailer    = require("nodemailer");
var emailSetup    = require("./emailsetup").bookingConfirmation.english;
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var port          = process.env.PORT || 8080;
var config        = require('./config');
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

// process.env.MONGOLAB_URI || process.env.MONGO_URI || 'mongodb://dbuser:dbpassword@dbhost.com:27017/dbname'
// Setup db instance
var dbProvider = new DbProvider(config.db[config.env]);
// Connect to db. I use (for now) 1 connection for the lifetime of this app
// And we do not use the a callback when connection here (we do in the testing)
dbProvider.connect(function(){});

// Set up email provider
var emailProvider = nodemailer.createTransport(config.mailer.transport, config.mailer.login);

emailSetup.from = config.mailer.from;

// curl -i -c cookies.txt -d "username=bob&password=secret" http://localhost:8080/login
// Curl needs -c cookies.txt to be able to store a cookie so we can stay logged in
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

doDbOperation('findAllNotes');
//--------- Note (db) requests - login required --------
// Find all notes, like:
// curl -i -b cookies.txt http://localhost:8080/get
app.get('/get',        ensureAuthenticated, doDbOperation('findAllNotes'));

// Find note by id, like:
// curl -i -b cookies.txt http://localhost:8080/get/id/51374299e669481c48a25c8c
app.get('/get/:id',    ensureAuthenticated, doDbOperation('findNoteById'));

// Create new note, like:
// curl -i -b cookies.txt -X POST -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich!"}' http://localhost:8080/new
app.post('/new',       ensureAuthenticated, doDbOperation('saveNote'));

// Update note, like:
// curl -i -b cookies.txt -X PUT -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich, quickly!"}' http://localhost:8080/update/5137d133d97331afb8000001
app.put('/update/:id', ensureAuthenticated, doDbOperation('saveNote'));

// curl -i -b cookies.txt -X DELETE http://localhost:8080/delete/51374299e669481c48a25c8c
app.del('/delete/:id', ensureAuthenticated, doDbOperation('deleteNote'));

app.listen(port, function() {
  console.log('Express listening at %s', port);
});

//------------ Other non-db-requests ------------

// Send email. First replace keywords from email text template.
// Example:
// curl -i -b cookies.txt -X POST -H 'Content-Type: application/json' -d '{"arrival":"2013.06.13", "departure":"2013.06.16", "email":"myemail@example.com"}' http://localhost:8080/send-mail
app.post('/send-mail', ensureAuthenticated, function(req, res){
  emailSetup.text = textReplace(emailSetup.originalText, req.body.replaceWith);
  emailSetup.to   = req.body.email;
  emailProvider.sendMail(emailSetup, function(error, response){
    if(error){
      console.log(error);
      res.json({result: 'error'});
    }else{
      console.log("Message sent: " + response.message);
      res.json({result: 'ok'});
    }
  });
});

//------------- Helper functions --------------------

// Generalized function for what to do with a request that interacts with the database
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.json({error: 'Not logged in'});
}

function doDbOperation(operation) {
  return function(req, res) {
    dbProvider[operation](req.params, function (err, result){
      return err ? res.send(err) : res.json(result);
    });
  }
};

// Replace keywords REPLACE1, REPLACE2... in original text with text form given array
function textReplace(originalText, replaceWith){
  for (var i=0; i<replaceWith.length; i++) {
    originalText = originalText.replace("REPLACE" + (i+1), replaceWith[i]);
  }
  return originalText;
}

process.on('uncaughtException', function (err) {
  console.log( "UNCAUGHT EXCEPTION " );
  console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});
