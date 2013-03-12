'use strict';

var restify      = require('restify');
var NoteProvider = require('./db').NoteProvider;
var routes       = require('./routes');

var server       = restify.createServer({ name: 'json-server' });
var noteProvider = new NoteProvider(
  process.env.mongo_host       || 'localhost',
  process.env.mongo_port       || 27017,
  process.env.mongo_db         || 'nki',
  process.env.mongo_collection || 'notes'
);

server.use(restify.bodyParser());
server.use(restify.queryParser());
server.use(function(req, res, next) {
  req.noteProvider = noteProvider; // make it available in the routes module
  next();
});

// Find all notes, like:
// curl -i http://localhost:8080/get
server.get('/get', routes.findAllNotes);

// Find note by id, like:
// curl -i http://localhost:8080/get/id/51374299e669481c48a25c8c
server.get('/get/:id', routes.findNoteById);


// Create new note, like:
// curl -i -X POST -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich!"' http://localhost:8080/new
server.post('/new', routes.saveNote);

// Update note, like:
// curl -i -X PUT -H 'Content-Type: application/json' -d '{"title": "My important note", "content": "Get rich, quickly!"}' http://localhost:8080/update/5137d133d97331afb8000001
server.put('/update/:id', routes.saveNote);

// curl -i -X DELETE http://localhost:8080/delete/51374299e669481c48a25c8c
server.del('/delete/:id', routes.deleteNote);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});

process.on('uncaughtException', function (err) {
  console.log( "UNCAUGHT EXCEPTION " );
  console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});

