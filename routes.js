'use strict';

exports.findAllNotes = function(req, res) {
  req.noteProvider.findAll(function (err, result){
      return err ? res.send(err) : res.json(result);
    }
  );
};

exports.findNoteById = function(req, res) {
  req.noteProvider.findById(req.params.id, function (err, result){
    return err ? res.send(err) : result ? res.json(result) : res.send(204);
  });
};

exports.saveNote = function(req, res) {
  req.noteProvider.save(req.params.id, {
    url: req.params.url,
    title: req.params.title,
    description: req.params.description,
    tags: req.params.tags
  }, function (err, result){
    return err ? res.send(err) : res.json(result);
  });
};

exports.deleteNote = function(req, res) {
  req.noteProvider.delete(req.params.id, function (err){
    return err ? res.send(err) : res.send(204);
  });
};