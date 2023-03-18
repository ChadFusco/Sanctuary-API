const { Comments } = require('../../db');
const users = require('../users/users');

const comments = {};
const confessions = {};

comments.create = (confession_id, created_by, comment) => (
  Comments.create({ confession_id, created_by, comment })
);

comments.popPlop = (commentID, popperUsername, popPlop) => (
  popPlop ? Comments.updateOne(
    { comment_id: commentID },
    { $set: { [`pops_list.${popperUsername}`]: true } },
    { $unset: { [`plops_list.${popperUsername}`]: '' } },
  )
    : Comments.updateOne(
      { comment_id: commentID },
      { $set: { [`plops_list.${popperUsername}`]: true } },
      { $unset: { [`pops_list.${popperUsername}`]: '' } },
    )
);

comments.reportComment = (confessionID, commentID, reportingUsername) => (
  confessions.readConfession(confessionID)
    .then((confession) => {
      const commentIdx = confession.comments.reduce((acc, val, i) => (
        val.comment_id === parseInt(commentID, 10) ? i : acc
      ), 0);
      if (!confession.comments[commentIdx].reported.some((item) => item === reportingUsername)) {
        confession.comments[commentIdx].reported.push(reportingUsername);
        return confession.save();
      }
      throw new Error('comment has already been reported by this user');
    })
    .then((confession) => Promise.all([
      users.updateReported(confession.created_by, confession.space_name),
      users.updateReports(reportingUsername, confession.space_name),
    ]))
);

comments.commentReportedRead = (confessionID, commentID) => {
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

comments.deleteComment = ({ confession_id, comment_id }) => (
  Confessions.findOneAndUpdate({ confession_id }, { $pull: { comments: { comment_id } } })
);

comments.deleteCommentsBySpaceAndUser = ({ space_name, username }) => (
  Confessions.findOneAndUpdate({ space_name }, {
    $pull: { comments: { created_by: username } },
  }, { multi: true })
);

module.exports = comments;
