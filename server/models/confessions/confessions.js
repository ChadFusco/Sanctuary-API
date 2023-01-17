const { Confessions } = require('../../db');
const users = require('../users/users');

const confessions = {};

confessions.readConfession = (confessionID) => (
  Confessions.findOne({ confession_id: confessionID })
);

confessions.findConfession = (spaceName, username, callback, page = 1, count = 4) => {
  const spaceNameRegex = spaceName ? new RegExp(spaceName, 'i') : /./;
  const usernameRegex = username ? new RegExp(username, 'i') : /./;
  const skip = (page - 1) * count;
  Confessions.find({
    space_name: spaceNameRegex,
    created_by: usernameRegex,
  }, null, {
    skip,
    limit: count,
  }, callback);
};

confessions.findComment = async (confessionID, commentID) => {
  const foundConfession = await confessions.readConfession(confessionID);
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
  const foundConfession = await confessions.readConfession(body.confession_id);
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
  const foundConfession = await confessions.readConfession(confessionID);
  const foundCommentIdx = foundConfession.comments.reduce((acc, val, i) => (
    val.comment_id === commentID ? i : acc
  ), 0);
  foundConfession.comments[foundCommentIdx].pops += delta;
  foundConfession.save()
    .then(() => callback())
    .catch((err) => callback(err));
};

confessions.reportConfession = async (confessionID, username, callback) => {
  let reportedConfession;
  await confessions.readConfession(confessionID)
    .then((confession) => {
      reportedConfession = confession;
      if (!confession.reported.some((item) => item === username)) {
        confession.reported.push(username);
      }
      return confession.save();
    })
    .then((confession) => users.readOne(confession.created_by))
    // increment reported user's "reported" object
    .then((user) => {
      const reportedUser = user;
      let wasIncremented = false;
      reportedUser.reported.forEach((space, i) => {
        if (space.space_name === reportedConfession.space_name) {
          wasIncremented = true;
          reportedUser.reported[i].qty += 1;
        }
      });
      if (!wasIncremented) {
        reportedUser.reported.push({
          space_name: reportedConfession.space_name,
          qty: 1,
        });
      }
      return reportedUser.save();
    })
    // increment reporting user's "reports" object
    .then(() => users.readOne(username))
    .then((user) => {
      const reportingUser = user;
      let wasIncremented = false;
      reportingUser.reports.forEach((space, i) => {
        if (space.space_name === reportedConfession.space_name) {
          wasIncremented = true;
          reportingUser.reports[i].qty += 1;
        }
      });
      if (!wasIncremented) {
        reportingUser.reports.push({
          space_name: reportedConfession.space_name,
          qty: 1,
        });
      }
      return reportingUser.save();
    })
    .then(() => callback())
    .catch((err) => callback(err));
};

module.exports = confessions;
