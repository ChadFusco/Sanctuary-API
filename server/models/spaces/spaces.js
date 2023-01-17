/* eslint-disable camelcase */
const { Spaces } = require('../../db');

const spaces = {};

spaces.create = (body, callback) => {
  Spaces.create({
    space_name: body.space_name,
    created_by: body.created_by,
    description: body.description,
    guidelines: body.guidelines,
  }, (err) => {
    if (err) {
      callback(err);
    } else {
      spaces.addMember(body.space_name, body.created_by, callback);
    }
  });
};

spaces.readOne = ({ room_name }, callback) => {
  Spaces.findOne({ room_name }, callback);
};

spaces.addMember = async (spaceName, username, callback) => {
  const foundSpace = await Spaces.findOne({ space_name: spaceName });
  foundSpace.members.push(username);
  await foundSpace.save()
    .then(() => callback())
    .catch((err) => callback(err));
};

spaces.removeMember = async (spaceName, username, callback) => {
  const foundSpace = await Spaces.findOne({ space_name: spaceName });
  foundSpace.members.push(username);
  foundSpace.members = foundSpace.members.filter((member) => member !== username);
  await foundSpace.save()
    .then(() => callback())
    .catch((err) => callback(err));
};

module.exports = spaces;
