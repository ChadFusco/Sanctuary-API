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

// eslint-disable-next-line consistent-return
users.readOne = (username, callback) => {
  if (!callback) {
    return Users.findOne({ username });
  }
  Users.findOne({ username }, callback);
};

users.updateSpacesCreated = async (spaceName, username, callback) => {
  const foundUser = await Users.findOne({ username });
  foundUser.spaces_created.push(spaceName);
  foundUser.spaces_joined.push(spaceName);
  await foundUser.save()
    .then(() => callback())
    .catch((err) => callback(err));
};

users.addSpacesJoined = async (spaceName, username, callback) => {
  const foundUser = await Users.findOne({ username });
  if (foundUser.banned.some((item) => item === username)) {
    callback(new Error('User is banned from this space!'));
  } else if (!foundUser.spaces_joined.some((item) => item === spaceName)) {
    foundUser.spaces_joined.push(spaceName);
    spaces.addMember(spaceName, username, (err) => {
      if (err) {
        callback(err);
      } else {
        foundUser.save();
        callback();
      }
    });
  } else {
    callback(new Error('user is already a member'));
  }
};

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

users.ban = async ({ space_name, username }) => {
  console.log('banning in progress for username:', username);
  return Users.findOneAndUpdate({ username }, { $push: { banned: space_name } });
};

module.exports = users;
