exports.generateFilter = (filter, exact) => {
  if (!filter) return /./;
  return exact ? filter : new RegExp(filter, 'i');
};
