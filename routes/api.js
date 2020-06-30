'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

//CONNECTION_STRING is your MongoDB Atlas database URI 

const CONNECTION_STRING = 'mongodb+srv:.../';

module.exports = function (app) {

  app.route('/api/issues/:project')

    .get(function (req, res) {
      var project = req.params.project;
      var searchQuery = req.query;
      if (searchQuery._id) { searchQuery._id = new ObjectId(searchQuery._id) }
      if (searchQuery.open) { searchQuery.open = (String(searchQuery.open) == "true") }
      MongoClient.connect(CONNECTION_STRING, function (err, client) {
        var collection = client.db().collection(project);
        collection.find(searchQuery).toArray(function (err, docs) {
          if (err) {
            res.status(500).send(err)
          } else {
            res.json(docs);
          }
        });
      })
    })

    .post(function (req, res) {
      let project = req.params.project;
      let issue = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      }
      if (!issue.issue_title || !issue.issue_text || !issue.created_by) {
        res.send('missing inputs');
      } else {
        MongoClient.connect(CONNECTION_STRING, function (err, client) {
          var collection = client.db().collection(project);
          collection.insertOne(issue, function (err, doc) {
            if (err) {
              res.status(500).send(err)
            } else {
              res.json(issue);
            }
          });
        });
      }
    })

    .put(function (req, res) {
      let project = req.params.project;
      const idString = req.body._id;
      let requestedChanges = req.body;
      delete req.body._id;
      for (var field in requestedChanges) {
        if (!requestedChanges[field]) {
          delete requestedChanges[field]
        }
      }
      if (requestedChanges.open) { requestedChanges.open = (String(requestedChanges.open) == "true") }
      if (Object.keys(requestedChanges).length === 0) {
        res.send('no updated field sent');
      } else {
        MongoClient.connect(CONNECTION_STRING, function (err, client) {
          var collection = client.db().collection(project);
          collection.updateOne({ "_id": new ObjectId(idString) }, { $set: requestedChanges }, function (err, doc) {
            if (err) {
              res.send('could not update' + idString);
            } else {
              res.send('successfully updated');
            }
          });
        });
      }
    })

    .delete(function (req, res) {

      var project = req.params.project;
      let idString = req.body._id;
      if (idString) {
        MongoClient.connect(CONNECTION_STRING, function (err, client) {
          var collection = client.db().collection(project);
          collection.deleteOne({ "_id": new ObjectId(idString) }, function (err, doc) {
            (!err) ? res.send('deleted ' + idString) : res.send('could not delete ' + idString + ' ' + err);
          });
        });
      } else {
        res.send('could not delete ' + idString);
      }
    });

};
