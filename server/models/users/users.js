/* eslint-disable camelcase */
const { Users } = require('../../db');
const spaces = require('../spaces/spaces');

const users = {};

users.create = (body, callback) => {
  Users.create({
    username: body.username,
    avatar: body.avatar,
  }, callback);
};

users.readOne = (username) => (
  Users.findOne({ username })
);

users.updateSpacesCreated = async (spaceName, username) => (
  Users.findOneAndUpdate(
    { username },
    { $push: { spaces_created: spaceName, spaces_joined: spaceName } },
  )
);

users.addSpacesJoined = async (spaceName, username) => (
  Users.findOne({ username })
    .then((foundUser) => {
      if (foundUser.banned.some((item) => item === username)) {
        return new Error('User is banned from this space!');
      }
      if (!foundUser.spaces_joined.some((item) => item === spaceName)) {
        return new Error('User is already a member');
      }
      foundUser.spaces_joined.push(spaceName);
      return foundUser.save();
    })
    .then(() => spaces.addMember(spaceName, username))
);

users.removeSpacesJoined = async ({ space_name, username }) => {
  const foundUser = await Users.findOne({ username });
  foundUser.spaces_joined = foundUser.spaces_joined.filter((space) => space !== space_name);
  await spaces.removeMember(space_name, username);
  return foundUser.save();
};

users.updateReported = async (username, spaceName) => {
  await users.readOne(username)
    .then((user) => {
      const reportedUser = user;
      let wasIncremented = false;
      reportedUser.reported.forEach((space, i) => {
        if (space.space_name === spaceName) {
          wasIncremented = true;
          reportedUser.reported[i].qty += 1;
        }
      });
      if (!wasIncremented) {
        reportedUser.reported.push({
          space_name: spaceName,
          qty: 1,
        });
      }
      return reportedUser.save();
    });
};

users.updateReports = async (username, spaceName) => {
  await users.readOne(username)
    .then((user) => {
      const reportingUser = user;
      let wasIncremented = false;
      reportingUser.reports.forEach((space, i) => {
        if (space.space_name === spaceName) {
          wasIncremented = true;
          reportingUser.reports[i].qty += 1;
        }
      });
      if (!wasIncremented) {
        reportingUser.reports.push({
          space_name: spaceName,
          qty: 1,
        });
      }
      return reportingUser.save();
    });
};

users.ban = async ({ space_name, username }) => (
  Users.findOneAndUpdate({ username }, { $push: { banned: space_name } })
);

users.reportedRead = async (username) => (
  Users.findOneAndUpdate({ username }, { $inc: { reported_read: 1 } })
);

module.exports = users;
