const { Confessions } = require('../../db');
const users = require('../users/users');

const confessions = {};

confessions.findConfession = (confessionID) => (
  Confessions.findOne({ confession_id: confessionID })
);

confessions.findComment = async (confessionID, commentID) => {
  const foundConfession = await confessions.findConfession(confessionID);
  return foundConfession.comments.reduce((acc, val) => (
    val.comment_id === commentID ? val : acc
  ));
};

confessions.create = (body, callback) => {
  Confessions.create({
    created_by: body.created_by,
    confession: body.confession,
    space_name: body.space_name,
  }, callback);
};

confessions.createComment = async (body, callback) => {
  const foundConfession = await confessions.findConfession(body.confession_id);
  const newComment = {
    created_by: body.created_by,
    comment: body.comment,
  };
  foundConfession.comments.push(newComment);
  await foundConfession.save()
    .then(() => callback())
    .catch((err) => callback(err));
};

confessions.popPlopComment = async (confessionID, commentID, delta, callback) => {
  const foundConfession = await confessions.findConfession(confessionID);
  const foundCommentIdx = foundConfession.comments.reduce((acc, val, i) => (
    val.comment_id === commentID ? i : acc
  ), 0);
  foundConfession.comments[foundCommentIdx].pops += delta;
  foundConfession.save()
    .then(() => callback())
    .catch((err) => callback(err));
};

confessions.reportConfession = async (confessionID, username) => {
  await confessions.findConfession(confessionID)
    .then((confession) => {
      confession.reported.push(username);
      return confession.save();
    })
    .then((confession) => {
      users.readOne()
    })
}

module.exports = confessions;
