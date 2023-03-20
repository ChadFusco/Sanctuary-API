const { Confessions } = require('../../db');
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

confessions.read = (confession_id) => (
  Confessions.aggregate([
    {
      $match: {
        confession_id: parseInt(confession_id, 10),
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: 'confession_id',
        foreignField: 'confession_id',
        as: 'comments',
      },
    },
  ])
);

confessions.find = (spaceName, username, spaceCreator, pg = 1, cnt = 4, exact = false) => {
  const spaceNameFilter = generateFilter(spaceName, exact);
  const usernameFilter = generateFilter(username, exact);
  const spaceCreatorFilter = generateFilter(spaceCreator, exact);
  const skip = (pg - 1) * cnt;
  const limit = parseInt(cnt, 10);
  return Confessions.aggregate([
    {
      $match: {
        space_name: spaceNameFilter,
        created_by: usernameFilter,
      },
    },
    {
      $lookup: {
        from: 'spaces',
        localField: 'space_name',
        foreignField: 'space_name',
        as: 'space',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'created_by',
        foreignField: 'username',
        as: 'user',
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: 'confession_id',
        foreignField: 'confession_id',
        as: 'comments',
      },
    },
    {
      $project: {
        _id: 0,
        created_by: 1,
        confession: 1,
        reported: 1,
        space_name: 1,
        hugs: 1,
        createdAt: 1,
        updatedAt: 1,
        confession_id: 1,
        reported_read: 1,
        comments: 1,
        conf_creator_avatar: '$user.avatar',
        space_creator: { $arrayElemAt: ['$space.created_by', 0] },
      },
    },
    {
      $match: {
        space_creator: spaceCreatorFilter,
      },
    },
  ])
    .skip(skip).limit(limit);
};

confessions.create = (created_by, confession, space_name) => (
  Confessions.create({ created_by, confession, space_name })
);

confessions.report = (confessionID, reportingUsername) => (
  Confessions.updateOne(
    { confession_id: confessionID },
    { $addToSet: { reported: reportingUsername } },
  )
);

confessions.addHug = ({ confession_id }) => (
  Confessions.findOneAndUpdate({ confession_id }, { $inc: { hugs: 1 } })
);

confessions.reportedRead = (confessionID) => (
  Confessions.findOneAndUpdate({ confessionID }, { reported_read: true })
    .then(() => (confessions.getConfSpaceCreator(confessionID)))
);

confessions.deleteConfession = ({ confession_id }) => (
  Confessions.deleteOne({ confession_id })
);

confessions.deleteBySpaceAndUser = (space_name, username) => (
  Confessions.deleteMany({ space_name, created_by: username })
);

module.exports = confessions;
