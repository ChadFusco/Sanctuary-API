/* eslint-disable camelcase */
// NOTE: THIS FILE IS NOT USED
const { Pops } = require('../../db');

const pops = {};

pops.popPlopComment = async (confessionID, commentID, popperUsername, pop_plop) => {
  const conf_comment_id = `${confessionID}-${commentID}`;
  return Pops.findOneAndUpdate(
    { conf_comment_id, username: popperUsername },
    { pop_plop },
    { upsert: true },
  );
};

module.exports = pops;
