/* eslint-disable camelcase */
const { Confessions } = require('../../db');
const users = require('../users/users');

const confessions = {};

// HELPER FUNCTIONS

confessions.getConfSpaceCreator = (confessionID) => (
  Confessions
    .aggregate([
      { $match: { confession_id: confessionID } },
      {
        $lookup: {
          from: 'spaces', localField: 'space_name', foreignField: 'space_name', as: 'space',
        },
      },
      {
        $project: {
          space: { $arrayElemAt: ['$space', 0] },
        },
      },
      {
        $addFields: {
          space_creator: '$space.created_by',
        },
      },
      {
        $project: {
          space_creator: 1,
        },
      },
    ])
);

confessions.readConfession = async (confessionID) => (
  Confessions.findOne({ confession_id: confessionID })
);

// eslint-disable-next-line max-len
confessions.findConfession = async (spaceName, username, spaceCreator, page = 1, count = 4, exact = false) => {
  const spaceNameRegex = spaceName ? new RegExp(spaceName, 'i') : /./;
  const spaceNameFilter = (exact && spaceName) ? spaceName : spaceNameRegex;
  const usernameRegex = username ? new RegExp(username, 'i') : /./;
  const usernameFilter = (exact && username) ? username : usernameRegex;
  const spaceCreatorRegex = spaceCreator ? new RegExp(spaceCreator, 'i') : /./;
  const spaceCreatorFilter = (exact && spaceCreator) ? spaceCreator : spaceCreatorRegex;
  const skip = (page - 1) * count;
  const limit = parseInt(count, 10);
  return Confessions
    .aggregate([
      { $match: { space_name: spaceNameFilter, created_by: usernameFilter } },
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
          reported_read: 1,
        },
      },
      { $match: { 'space.created_by': spaceCreatorFilter } },
      {
        $lookup: {
          from: 'users', localField: 'created_by', foreignField: 'username', as: 'user',
        },
      },
      {
        $project: {
          user: { $arrayElemAt: ['$user', 0] },
          space: 1,
          created_by: 1,
          confession: 1,
          reported: 1,
          space_name: 1,
          hugs: 1,
          comments: 1,
          createdAt: 1,
          updatedAt: 1,
          confession_id: 1,
          reported_read: 1,
        },
      },
      {
        $addFields: {
          conf_creator_avatar: '$user.avatar',
          space_creator: '$space.created_by',
        },
      },
      {
        $project: {
          user: 0,
          space: 0,
        },
      },
    ])
    .skip(skip).limit(limit);
};

confessions.create = (body) => (
  Confessions.create({
    created_by: body.created_by,
    confession: body.confession,
    space_name: body.space_name,
  })
);

confessions.createComment = async (body) => {
  const foundConfession = await confessions.readConfession(body.confession_id);
  const newComment = {
    created_by: body.created_by,
    comment: body.comment,
  };
  foundConfession.comments.push(newComment);
  return foundConfession.save();
};

confessions.popPlop = async (confessionID, commentID, popperUsername, popPlop) => (
  confessions.readConfession(confessionID)
    .then((confession) => {
      const foundConf = confession;
      const foundCommentIdx = foundConf.comments.reduce((acc, val, i) => (
        val.comment_id === parseInt(commentID, 10) ? i : acc
      ), 0);
      if (popPlop) {
        foundConf.comments[foundCommentIdx].pops_list[popperUsername] = true;
        delete foundConf.comments[foundCommentIdx].plops_list[popperUsername];
      } else {
        foundConf.comments[foundCommentIdx].plops_list[popperUsername] = true;
        delete foundConf.comments[foundCommentIdx].pops_list[popperUsername];
      }
      return foundConf;
    })
    .then((confession) => {
      confession.markModified('comments');
      return confession.save();
    })
);

// confessions.popPlopComment = async (confessionID, commentID, delta, callback) => {
//   const foundConfession = await confessions.readConfession(confessionID);
//   const foundCommentIdx = foundConfession.comments.reduce((acc, val, i) => (
//     val.comment_id === parseInt(commentID, 10) ? i : acc
//   ), 0);
//   foundConfession.comments[foundCommentIdx].pops += delta;
//   foundConfession.save()
//     .then(() => callback())
//     .catch((err) => callback(err));
// };

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
        val.comment_id === parseInt(commentID, 10) ? i : acc
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

confessions.commentReportedRead = async (confessionID, commentID) => {
  let readConfession;
  return confessions.readConfession(confessionID)
    .then((confession) => {
      readConfession = confession;
      const commentIdx = confession.comments.reduce((acc, val, i) => (
        val.comment_id === parseInt(commentID, 10) ? i : acc
      ), 0);
      readConfession.comments[commentIdx].reported_read = true;
      return readConfession;
    })
    .then(() => (confessions.getConfSpaceCreator(confessionID)))
    .then((confs) => (users.reportedRead(confs[0].space_creator)))
    .then(() => readConfession.save());
};

confessions.addHug = ({ confession_id }) => (
  Confessions.findOneAndUpdate({ confession_id }, { $inc: { hugs: 1 } })
);

confessions.reportedRead = (confessionID) => (
  Confessions.findOneAndUpdate({ confessionID }, { reported_read: true })
    .then(() => (confessions.getConfSpaceCreator(confessionID)))
    .then((confs) => (users.reportedRead(confs[0].space_creator)))
);

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
