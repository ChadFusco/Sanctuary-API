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

spaces.update = (space_name, changes, callback) => {
  const spaceUpdates = {};
  if (changes.description) {
    spaceUpdates.description = changes.description;
  }
  if (changes.guidelines) {
    spaceUpdates.guidelines = changes.guidelines;
  }
  Spaces.findOneAndUpdate({ space_name }, spaceUpdates, callback);
};

spaces.read = async (space_name, page = 1, count = 4, exact = false) => {
  const spaceNameRegex = space_name ? new RegExp(space_name, 'i') : /./;
  const spaceNameFilter = (exact && space_name) ? space_name : spaceNameRegex;
  const skip = (page - 1) * count;
  const limit = parseInt(count, 10);
  return Spaces.find({ space_name: spaceNameFilter }, null, { skip, limit });
};

spaces.addMember = async (spaceName, username, callback) => {
  Spaces.findOne({ space_name: spaceName })
    .then((foundSpace) => {
      if (!foundSpace.members.some((item) => item === username)) {
        foundSpace.members.push(username);
      }
      return foundSpace.save();
    })
    .then(() => callback())
    .catch((err) => callback(err));
};

spaces.removeMember = async (spaceName, username) => {
  const foundSpace = await Spaces.findOne({ space_name: spaceName });
  foundSpace.members = foundSpace.members.filter((member) => member !== username);
  return foundSpace.save();
};

module.exports = spaces;
