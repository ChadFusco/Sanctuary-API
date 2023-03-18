/* eslint-disable import/no-extraneous-dependencies */
// REQUIRE STATEMENTS
require('dotenv').config();
const debug = require('debug')('http');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const admin = require('firebase-admin');
const serviceAccount = require('../private/sanctuary-348d4-firebase-adminsdk-vvs0z-b38b3c7260.json');
const { authenticate } = require('./util');
const {
  users, spaces, confessions, comments,
} = require('./models');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// HELPER FUNCTIONS

const changePopsPlopsListToInt = (conf) => {
  const filteredConfession = { ...conf };
  const commentsWithPops = filteredConfession.comments.map((comment) => {
    const newComment = { ...comment };
    const pops = Object.keys(newComment.pops_list || {}).length
      - Object.keys(newComment.plops_list || {}).length;
    delete newComment.plops_list;
    delete newComment.pops_list;
    return { ...newComment, pops };
  });
  return { ...filteredConfession, comments: commentsWithPops };
};

const app = express();

// APP-WIDE MIDDLEWARE
app.use((req, res, next) => {
  debug('Request rcvd, Morgan starting...');
  next();
});
app.use(morgan('dev'));
app.use((req, res, next) => {
  debug('Morgan complete. Remaining middleware starting...');
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(authenticate);

// ----------------------------------------
// GET ROUTES -----------------------------
// ----------------------------------------

// ENDPT #1
app.get('/users/:username', (req, res) => {
  users.readOne(req.params.username)
    .then((user) => res.status(user ? 200 : 204).send(user))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #2
app.get('/spaces', (req, res) => {
  const exact = !(req.query.exact === 'false' || !req.query.exact);
  spaces.read(req.query.space_name, req.query.page, req.query.count, exact)
    .then((space) => res.status(space ? 200 : 204).send(space))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #3
app.get('/confessions', (req, res) => {
  const {
    reported, space_name, username, space_creator, page, count,
  } = req.query;
  const exact = !(req.query.exact === 'false' || !req.query.exact);
  confessions.findConfession(space_name, username, space_creator, page, count, exact)
    .then((foundConfessions) => {
      let filteredConfessions = foundConfessions;
      if (reported !== undefined) {
        filteredConfessions = filteredConfessions.map((confession) => {
          const filteredConfession = { ...confession };
          const filteredComments = filteredConfession.comments.filter((comment) => (
            (reported === 'true' ? (comment.reported.length > 0) : (comment.reported.length === 0))
          ));
          return { ...filteredConfession, comments: filteredComments };
        });
        filteredConfessions = filteredConfessions.filter((confession) => {
          let filter = confession.reported.length > 0 || confession.comments.length > 0;
          filter = (reported === 'true' ? filter : !filter);
          return filter;
        });
      }
      // convert plops_list and pops_list to pops
      filteredConfessions = filteredConfessions.map((confession) => (
        changePopsPlopsListToInt(confession)
      ));
      res.status(200).send(filteredConfessions);
    })
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #19
app.get('/confessions/:confession_id', (req, res) => {
  confessions.read(req.params.confession_id)
    .then((conf) => changePopsPlopsListToInt(conf.toObject()))
    .then((conf) => res.status(conf ? 200 : 404).send(conf))
    .catch((err) => res.status(400).send(err.stack));
});

// ----------------------------------------
// POST ROUTES ----------------------------
// ----------------------------------------

// ENDPT #16
app.post('/users', (req, res) => {
  users.create(req.body.username, req.body.avatar)
    .then(() => res.status(201).send('CREATED'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #6
app.post('/spaces', (req, res) => {
  const {
    space_name,
    created_by,
    description,
    guidelines,
  } = req.body;
  spaces.create(space_name, created_by, description, guidelines)
    .then(() => users.updateSpacesCreated(space_name, created_by))
    .then(() => res.status(201).send('CREATED'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #4
app.post('/confessions', (req, res) => {
  confessions.create(req.body.created_by, req.body.confession, req.body.space_name)
    .then(() => res.status(201).send('CREATED'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #5
app.post('/comments', (req, res) => {
  comments.create(req.body.confession_id, req.body.created_by, req.body.comment)
    .then(() => res.status(201).send('CREATED'))
    .catch((err) => res.status(400).send(err.stack));
});

// ----------------------------------------
// PATCH ROUTES ---------------------------
// ----------------------------------------

// ENDPT #7
app.patch('/confessions/:confession_id/report/:username', (req, res) => {
  confessions.reportConfession(req.params.confession_id, req.params.username)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(`${err.name} | ${err.message} | ${err.stack}`));
});

// ENDPT #8
app.patch('/confessions/:confession_id/:comment_id/report/:username', (req, res) => {
  const { comment_id, username } = req.params;
  comments.report(comment_id, username)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(`${err.name} | ${err.message} | ${err.stack}`));
});

// ENDPT #9
app.patch('/confessions/:confession_id/:comment_id/pop/:username', (req, res) => {
  comments.popPlop(req.params.comment_id, req.params.username, true)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #10
app.patch('/confessions/:confession_id/:comment_id/plop/:username', (req, res) => {
  comments.popPlop(req.params.comment_id, req.params.username, false)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #11
app.patch('/spaces/:space_name/:username/add', (req, res) => {
  users.addSpacesJoined(req.params.space_name, req.params.username)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(`${err.name} | ${err.message} | ${err.stack}`));
});

// ENDPT #12
app.patch('/spaces/:space_name/:username/remove', (req, res) => {
  users.removeSpacesJoined(req.params.space_name, req.params.username)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #13
app.patch('/spaces/:space_name/:username/ban', (req, res) => {
  // first, delete all the user's comments in the space
  comments.deleteBySpaceAndUser(req.params.space_name, req.params.username)
    // second, delete all the user's confessions in the space
    .then(() => confessions.deleteBySpaceAndUser(req.params.space_name, req.params.username))
    // third, remove the user from the space,
    // incl updating the user's "space_joined" field and the space's "members" field
    .then(() => users.removeSpacesJoined(req.params.space_name, req.params.username))
    // fourth, add the space_name to the user's "banned" array
    .then(() => users.ban(req.params.space_name, req.params.username))
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #17
app.patch('/spaces/:space_name', (req, res) => {
  spaces.update(req.params.space_name, req.body)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #18
app.patch('/confessions/:confession_id/hug', (req, res) => {
  confessions.addHug(req.params)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #20
app.patch('/confessions/:confession_id/:comment_id/reported_read', (req, res) => {
  const commentID = parseInt(req.params.comment_id, 10);
  comments.reportedRead(commentID)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #21
app.patch('/confessions/:confession_id/reported_read', (req, res) => {
  const confessionID = parseInt(req.params.confession_id, 10);
  confessions.reportedRead(confessionID)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ----------------------------------------
// DELETE ROUTES --------------------------
// ----------------------------------------

// ENDPT #14
app.delete('/confessions/:confession_id', (req, res) => {
  confessions.deleteConfession(req.params)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #15
app.delete('/confessions/:confession_id/:comment_id', (req, res) => {
  comments.delete(req.params.comment_id)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// ENDPT #22
app.delete('/spaces/:space_name', (req, res) => {
  spaces.delete(req.params.space_name)
    .then(() => res.status(204).send('NO CONTENT'))
    .catch((err) => res.status(400).send(err.stack));
});

// next line allows for the Jest coverage report
module.exports = app;
