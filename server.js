'use strict';

var express      = require('express');
var app          = express();
var NoteProvider = require('./db').NoteProvider;
var port         = process.env.express_port || 8080;

app.configure(function () {
  app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
  app.use(express.bodyParser());
});

var noteProvider = new NoteProvider(
  process.env.mongo_host       || 'localhost',
  process.env.mongo_port       || 27017,
  process.env.mongo_db         || 'nki',
  process.env.mongo_collection || 'notes'
);

// Generalized function for what to do with a request
var doOperation = function(operation) {
  return function(req, res) {
    noteProvider[operation](req.params, function (err, result){
      return err ? res.send(err) : res.json(result);
    });
  }
};

// Find all notes, like:
// curl -i http://localhost:8080/get
app.get('/get', doOperation('findAllNotes'));

// Find note by id, like:
// curl -i http://localhost:8080/get/id/51374299e669481c48a25c8c
app.get('/get/:id', doOperation('findNoteById'));


// Create new note, like:
// curl -i -X POST -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich!"' http://localhost:8080/new
app.post('/new', doOperation('saveNote'));

// Update note, like:
// curl -i -X PUT -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich, quickly!"}' http://localhost:8080/update/5137d133d97331afb8000001
app.put('/update/:id', doOperation('saveNote'));

// curl -i -X DELETE http://localhost:8080/delete/51374299e669481c48a25c8c
app.del('/delete/:id', doOperation('deleteNote'));

app.listen(port, function() {
  console.log('Express listening at %s', port);
});

process.on('uncaughtException', function (err) {
  console.log( "UNCAUGHT EXCEPTION " );
  console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});

