/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
// REQUIRE STATEMENTS
require('dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const debug = require('debug')('http');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const {
  users, spaces, confessions,
} = require('./models');

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

app.get('/', (req, res) => {
  res.status(200).send('Sanctuary API server successfully accessed');
});

// ----------------------------------------
// GET ROUTES -----------------------------
// ----------------------------------------

// ENDPT #1
app.get('/users/:username', (req, res) => {
  users.readOne(req.params.username, (err, user) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(user);
    }
  });
});

// ENDPT #2
app.get('/spaces', (req, res) => {
  spaces.read(
    req.query.space_name,
    (err, space) => {
      if (err) {
        res.status(400).send(err);
      } else {
        res.status(200).send(space);
      }
    },
    req.query.page,
    req.query.count,
  );
});

// ENDPT #3
app.get('/confessions', (req, res) => {
  const {
    reported, space_name, username, page, count,
  } = req.query;
  confessions.findConfession(
    space_name,
    username,
    reported,
    (err, foundConfessions) => {
      if (err) {
        res.status(400).send(err);
      } else {
        let filteredConfessions = foundConfessions;
        // console.log('filteredConfessions:', filteredConfessions);
        if (reported !== undefined) {
          // filter comments on each confession:
          filteredConfessions = foundConfessions.map((confession) => {
            let filteredConfession = { ...confession };
            filteredConfession = filteredConfession._doc;
            const filteredComments = filteredConfession.comments.filter((comment) => (
              (reported === 'true' ? (comment.reported.length > 0) : (comment.reported.length === 0))
            ));
            // console.log('new confession:', { ...confession, comments: filteredComments });
            return { ...filteredConfession, comments: filteredComments };
          });
          filteredConfessions = filteredConfessions.filter((confession) => {
            console.log('confession:', confession);
            let filter = confession.reported.length > 0 || confession.comments.length > 0;
            filter = reported === 'true' ? filter : !filter;
            return filter;
          });
        }
        res.status(200).send(filteredConfessions);
      }
    },
    page,
    count,
  );
});

// ----------------------------------------
// POST ROUTES ----------------------------
// ----------------------------------------

// ENDPT #16
app.post('/users', (req, res) => {
  users.create(req.body, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(201).send('CREATED');
    }
  });
});

// ENDPT #6
app.post('/spaces', (req, res) => {
  spaces.create(req.body, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      users.updateSpacesCreated(req.body.space_name, req.body.created_by, (error) => {
        if (error) {
          res.status(400).send(error);
        } else {
          res.status(201).send('CREATED');
        }
      });
    }
  });
});

// ENDPT #4
app.post('/confessions', (req, res) => {
  confessions.create(req.body, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(201).send('CREATED');
    }
  });
});

// ENDPT #5
app.post('/comments', (req, res) => {
  confessions.createComment(req.body, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(201).send('CREATED');
    }
  });
});

// ----------------------------------------
// PATCH ROUTES ---------------------------
// ----------------------------------------

// ENDPT #7
app.patch('/confessions/:confession_id/report/:username', (req, res) => {
  confessions.reportConfession(req.params.confession_id, req.params.username, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).send('NO CONTENT');
    }
  });
});

// ENDPT #8
app.patch('/confessions/:confession_id/:comment_id/report/:username', (req, res) => {
  const { confession_id, comment_id, username } = req.params;
  confessions.reportComment(confession_id, comment_id, username, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).send('NO CONTENT');
    }
  });
});

// ENDPT #9
app.patch('/confessions/:confession_id/:comment_id/pop', (req, res) => {
  confessions.popPlopComment(req.params.confession_id, req.params.comment_id, 1, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).send('NO CONTENT');
    }
  });
});

// ENDPT #10
app.patch('/confessions/:confession_id/:comment_id/plop', (req, res) => {
  confessions.popPlopComment(req.params.confession_id, req.params.comment_id, -1, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).send('NO CONTENT');
    }
  });
});

// ENDPT #11
app.patch('/spaces/:space_name/:username/add', (req, res) => {
  users.addSpacesJoined(req.params.space_name, req.params.username, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).send('NO CONTENT');
    }
  });
});

// ENDPT #7
app.patch('/spaces/:space_name/:username/remove', (req, res) => {
  users.removeSpacesJoined(req.params.space_name, req.params.username, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).send('NO CONTENT');
    }
  });
});

// ENDPT #17
app.patch('/spaces/:space_name', (req, res) => {
  spaces.update(req.params.space_name, req.body, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).send('NO CONTENT');
    }
  });
});

// ENDPT #18
app.patch('/confessions/:confession_id/hug', (req, res) => {
  confessions.addHug(req.params, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).send('NO CONTENT');
    }
  });
});

// ----------------------------------------
// DELETE ROUTES --------------------------
// ----------------------------------------

// ENDPT #14
app.delete('/confessions/:confession_id', (req, res) => {
  confessions.delete(req.params, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).send('NO CONTENT');
    }
  });
});

// next line allows for Jest coverage report
module.exports = app;
