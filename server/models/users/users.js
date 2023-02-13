/* eslint-disable camelcase */
const { Users } = require('../../db');
const spaces = require('../spaces/spaces');

const users = {};

users.create = (username, avatar) => Users.create({ username, avatar });

users.readOne = (username) => Users.findOne({ username });

users.updateSpacesCreated = (spaceName, username) => (
  Users.findOneAndUpdate(
    { username },
    { $addToSet: { spaces_created: spaceName, spaces_joined: spaceName } },
    { new: true },
  )
    .then((user) => user)
);

users.addSpacesJoined = (spaceName, username) => (
  Users.findOne({ username })
    .then((foundUser) => {
      if (foundUser.banned.some((item) => item === username)) {
        return new Error('User is banned from this space!');
      }
      if (foundUser.spaces_joined.some((item) => item === spaceName)) {
        return new Error('User is already a member');
      }
      foundUser.spaces_joined.push(spaceName);
      return foundUser.save();
    })
    .then(() => spaces.addMember(spaceName, username))
);

users.removeSpacesJoined = ({ space_name, username }) => (
  spaces.removeMember(space_name, username)
    .then(() => Users.findOneAndUpdate(
      { username },
      { $pull: { spaces_joined: space_name } },
      { new: true },
    ))
);

users.updateReported = (username, spaceName) => (
  users.readOne(username)
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
    })
);

users.updateReports = (username, spaceName) => (
  users.readOne(username)
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
    })
);

users.ban = ({ space_name, username }) => (
  Users.findOneAndUpdate({ username }, { $addToSet: { banned: space_name } }, { new: true })
);

users.reportedRead = (username) => (
  Users.findOneAndUpdate({ username }, { $inc: { reported_read: 1 } })
);

module.exports = users;
