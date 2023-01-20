/* eslint-disable camelcase */
const { Confessions } = require('../../db');
const users = require('../users/users');

const confessions = {};

confessions.readConfession = async (confessionID) => (
  Confessions.findOne({ confession_id: confessionID })
);

// confessions.findConfession = async (spaceName, username, page = 1, count = 4) => {
//   const spaceNameRegex = spaceName ? new RegExp(spaceName, 'i') : /./;
//   const usernameRegex = username ? new RegExp(username, 'i') : /./;
//   const skip = (page - 1) * count;
//   const query = { space_name: spaceNameRegex, created_by: usernameRegex };
//   // if (reported === 'true') {
//   //   query.reported = { $not: { $size: 0 } };
//   // } else if (reported === 'false') {
//   //   query.reported = { $size: 0 };
//   // }
//   return Confessions.find(query, null, { skip, limit: count });
// };

confessions.findConfession = async (spaceName, username, spaceCreator, page = 1, count = 4) => {
  const spaceNameRegex = spaceName ? new RegExp(spaceName, 'i') : /./;
  const usernameRegex = username ? new RegExp(username, 'i') : /./;
  const skip = (page - 1) * count;
  const spaceCreatorRegex = spaceCreator ? new RegExp(spaceCreator, 'i') : /./;
  return Confessions
    .aggregate([
      { $match: { space_name: spaceNameRegex, created_by: usernameRegex } },
      {
        $lookup: {
          from: 'spaces', localField: 'space_name', foreignField: 'space_name', as: 'space',
        },
      },
      {
        $project: {
          space: { $arrayElemAt: ['$space', 0] },
          created_by: 1,
          confession: 1,
          reported: 1,
          space_name: 1,
          hugs: 1,
          comments: 1,
          createdAt: 1,
          updatedAt: 1,
          confession_id: 1,
        },
      },
      { $match: { 'space.created_by': spaceCreatorRegex } },
      {
        $addFields: {
          space_creator: '$space.created_by',
        },
      },
      {
        $project: {
          space: 0,
        },
      },
    ])
    .skip(skip).limit(count);
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

confessions.popPlop = async (confessionID, commentID, popperUsername, delta) => (
  confessions.readConfession(confessionID)
    .then((confession) => {
      const foundCommentIdx = confession.comments.reduce((acc, val, i) => (
        val.comment_id === parseInt(commentID, 10) ? i : acc
      ), 0);
      // foundConfession.comments[foundCommentIdx].pops += delta;
      confession.comments[foundCommentIdx].find()
    })
    .then((confession) => confession.save())
);

confessions.reportConfession = async (confessionID, reportingUsername, callback) => {
  let reportedConfession;
  await confessions.readConfession(confessionID)
    .then((confession) => {
      reportedConfession = confession;
      if (!confession.reported.some((item) => item === reportingUsername)) {
        confession.reported.push(reportingUsername);
        return reportedConfession;
      }
      return new Error('confession has already been reported by this user');
    })
    .then((confession) => users.updateReported(confession.created_by, confession.space_name))
    .then(() => users.updateReports(reportingUsername, reportedConfession.space_name))
    .then(() => {
      reportedConfession.save();
      return callback();
    })
    .catch((err) => callback(err));
};

confessions.reportComment = async (confessionID, commentID, reportingUsername, callback) => {
  let reportedConfession;
  await confessions.readConfession(confessionID)
    .then((confession) => {
      reportedConfession = confession;
      const commentIdx = confession.comments.reduce((acc, val, i) => (
        val.comment_id === commentID ? i : acc
      ), 0);
      if (!confession.comments[commentIdx].reported.some((item) => item === reportingUsername)) {
        confession.comments[commentIdx].reported.push(reportingUsername);
        return confession.comments[commentIdx].created_by;
      }
      return new Error('comment has already been reported by this user');
    })
    .then((reportedUsername) => (
      users.updateReported(reportedUsername, reportedConfession.space_name)
    ))
    .then(() => users.updateReports(reportingUsername, reportedConfession.space_name))
    .then(() => {
      reportedConfession.save();
      return callback();
    })
    .catch((err) => callback(err));
};

confessions.addHug = ({ confession_id }, callback) => {
  Confessions.findOneAndUpdate({ confession_id }, { $inc: { hugs: 1 } }, callback);
};

confessions.deleteConfession = ({ confession_id }, callback) => {
  Confessions.deleteOne({ confession_id }, callback);
};

confessions.deleteConfBySpaceAndUser = async ({ space_name, username }) => (
  Confessions.deleteMany({ space_name, created_by: username })
);

confessions.deleteComment = async ({ confession_id, comment_id }, callback) => {
  Confessions.findOneAndUpdate({ confession_id }, {
    $pull: { comments: { comment_id } },
  }, callback);
};

confessions.deleteCommentsBySpaceAndUser = async ({ space_name, username }) => (
  Confessions.findOneAndUpdate({ space_name }, {
    $pull: { comments: { created_by: username } },
  }, { multi: true })
);

module.exports = confessions;
