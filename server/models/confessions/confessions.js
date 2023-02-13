/* eslint-disable camelcase */
const { Confessions } = require('../../db');
const users = require('../users/users');
const { generateFilter } = require('../../util');

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

// MODEL FUNCTIONS

confessions.readConfession = (confession_id) => Confessions.findOne({ confession_id });

// eslint-disable-next-line max-len
confessions.findConfession = (spaceName, username, spaceCreator, page = 1, count = 4, exact = false) => {
  const spaceNameFilter = generateFilter(spaceName, exact);
  const usernameFilter = generateFilter(username, exact);
  const spaceCreatorFilter = generateFilter(spaceCreator, exact);
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

confessions.create = (created_by, confession, space_name) => (
  Confessions.create({ created_by, confession, space_name })
);

confessions.createComment = async (confession_id, created_by, comment) => {
  const foundConfession = await confessions.readConfession(confession_id);
  const newComment = { created_by, comment };
  foundConfession.comments.push(newComment);
  return foundConfession.save();
};

confessions.popPlop = (confessionID, commentID, popperUsername, popPlop) => (
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

confessions.reportConfession = (confessionID, reportingUsername) => (
  confessions.readConfession(confessionID)
    .then((confession) => {
      if (!confession.reported.some((item) => item === reportingUsername)) {
        confession.reported.push(reportingUsername);
        return confession.save();
      }
      return new Error('confession has already been reported by this user');
    })
    .then((confession) => Promise.all([
      users.updateReported(confession.created_by, confession.space_name),
      users.updateReports(reportingUsername, confession.space_name),
    ]))
);

confessions.reportComment = (confessionID, commentID, reportingUsername) => (
  confessions.readConfession(confessionID)
    .then((confession) => {
      const commentIdx = confession.comments.reduce((acc, val, i) => (
        val.comment_id === parseInt(commentID, 10) ? i : acc
      ), 0);
      if (!confession.comments[commentIdx].reported.some((item) => item === reportingUsername)) {
        confession.comments[commentIdx].reported.push(reportingUsername);
        return confession.save();
      }
      return new Error('comment has already been reported by this user');
    })
    .then((confession) => Promise.all([
      users.updateReported(confession.created_by, confession.space_name),
      users.updateReports(reportingUsername, confession.space_name),
    ]))
);

confessions.commentReportedRead = (confessionID, commentID) => {
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

confessions.deleteConfession = ({ confession_id }) => (
  Confessions.deleteOne({ confession_id })
);

confessions.deleteConfBySpaceAndUser = ({ space_name, username }) => (
  Confessions.deleteMany({ space_name, created_by: username })
);

confessions.deleteComment = ({ confession_id, comment_id }) => (
  Confessions.findOneAndUpdate({ confession_id }, { $pull: { comments: { comment_id } } })
);

confessions.deleteCommentsBySpaceAndUser = ({ space_name, username }) => (
  Confessions.findOneAndUpdate({ space_name }, {
    $pull: { comments: { created_by: username } },
  }, { multi: true })
);

module.exports = confessions;
