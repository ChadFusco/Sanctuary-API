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

comments.commentReportedRead = (confessionID, commentID) => {
  let readConfession;
  return confessions.read(confessionID)
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

comments.deleteComment = ({ confession_id, comment_id }) => (
  Confessions.findOneAndUpdate({ confession_id }, { $pull: { comments: { comment_id } } })
);

comments.deleteCommentsBySpaceAndUser = ({ space_name, username }) => (
  Confessions.findOneAndUpdate({ space_name }, {
    $pull: { comments: { created_by: username } },
  }, { multi: true })
);

module.exports = comments;
