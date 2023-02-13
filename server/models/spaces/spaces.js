/* eslint-disable camelcase */
const { Spaces } = require('../../db');

const spaces = {};

spaces.create = (space_name, created_by, description, guidelines) => (
  Spaces.create({
    space_name,
    created_by,
    description,
    guidelines,
  })
    .then(() => spaces.addMember(space_name, created_by))
);

spaces.update = (space_name, changes) => {
  const spaceUpdates = {};
  if (changes.description) {
    spaceUpdates.description = changes.description;
  }
  if (changes.guidelines) {
    spaceUpdates.guidelines = changes.guidelines;
  }
  return Spaces.findOneAndUpdate({ space_name }, spaceUpdates);
};

spaces.read = async (space_name, page = 1, count = 4, exact = false) => {
  const spaceNameRegex = space_name ? new RegExp(space_name, 'i') : /./;
  const spaceNameFilter = (exact && space_name) ? space_name : spaceNameRegex;
  const skip = (page - 1) * count;
  const limit = parseInt(count, 10);
  return Spaces.find({ space_name: spaceNameFilter }, null, { skip, limit });
};

spaces.addMember = async (spaceName, username) => (
  Spaces.findOne({ space_name: spaceName })
    .then((foundSpace) => {
      if (!foundSpace.members.some((item) => item === username)) {
        foundSpace.members.push(username);
      }
      return foundSpace.save();
    })
);

spaces.removeMember = async (spaceName, username) => {
  const foundSpace = await Spaces.findOne({ space_name: spaceName });
  foundSpace.members = foundSpace.members.filter((member) => member !== username);
  return foundSpace.save();
};

module.exports = spaces;
