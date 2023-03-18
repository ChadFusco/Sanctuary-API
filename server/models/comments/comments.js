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

comments.deleteCommentsBySpaceAndUser = ({ space_name, username }) => (
  Confessions.findOneAndUpdate({ space_name }, {
    $pull: { comments: { created_by: username } },
  }, { multi: true })
);

module.exports = comments;
