/* eslint-disable camelcase */
const { Spaces } = require('../../db');
const { generateFilter } = require('../../util');

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

spaces.read = (spaceName, page = 1, count = 4, exact = false) => {
  const spaceNameFilter = generateFilter(spaceName, exact);
  const skip = (page - 1) * count;
  const limit = parseInt(count, 10);
  return Spaces.find({ spaceName: spaceNameFilter }, null, { skip, limit });
};

spaces.addMember = (space_name, username) => (
  Spaces.findOneAndUpdate({ space_name }, { $addToSet: { members: username } }, { new: true })
);

spaces.removeMember = (space_name, username) => (
  Spaces.findOneAndUpdate({ space_name }, { $pull: { members: username } }, { new: true })
);

module.exports = spaces;
