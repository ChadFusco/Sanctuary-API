const { Comments } = require('../../db');
const users = require('../users/users');
const confessions = require('../confessions/confessions');

const comments = {};

comments.create = (confession_id, created_by, comment) => (
  Comments.create({ confession_id, created_by, comment })
);

comments.popPlop = (commentID, popperUsername, popPlop) => (
  popPlop ? Comments.updateOne(
    { comment_id: commentID },
    {
      $set: { [`pops_list.${popperUsername}`]: true },
      $unset: { [`plops_list.${popperUsername}`]: '' },
    },
  )
    : Comments.updateOne(
      { comment_id: commentID },
      {
        $set: { [`plops_list.${popperUsername}`]: true },
        $unset: { [`pops_list.${popperUsername}`]: '' },
      },
    )
);

comments.report = (comment_id, reportingUsername) => (
  Comments.findOneAndUpdate(
    { comment_id },
    { $addToSet: { reported: reportingUsername } },
    { new: true },
  )
    .then(async (comment) => {
      const { space_name } = await confessions.read(comment.confession_id);
      Promise.all([
        users.updateReported(comment.created_by, space_name),
        users.updateReports(reportingUsername, space_name),
      ]);
    })
);

comments.reportedRead = (comment_id) => (
  Comments.findOneAndUpdate({ comment_id }, { reported_read: true })
    .then(({ confession_id }) => confessions.getConfSpaceCreator(confession_id))
    .then((confs) => users.reportedRead(confs[0].space_creator))
);

comments.delete = (comment_id) => Comments.deleteOne({ comment_id });

comments.deleteBySpaceAndUser = (space_name, username) => (
  Comments.aggregate([
    {
      $lookup: {
        from: 'confessions',
        localField: 'confession_id',
        foreignField: 'confession_id',
        as: 'confession',
      },
    },
    {
      $match: { 'confession.space_name': space_name, created_by: username },
    },
    {
      $project: { _id: 0, comment_id: 1 },
    },
  ])
    .then((foundComments) => foundComments.map((comment) => comment.comment_id))
    .then((commentIDs) => Comments.deleteMany({ comment_id: { $in: commentIDs } }))
);

module.exports = comments;
