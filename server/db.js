const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const AutoIncrement = require('mongoose-sequence')(mongoose);

mongoose.set('strictQuery', true);

mongoose.connect('mongodb://localhost:27017/sanctuary');

const MAX_SPACES = 1000;
const usersSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  avatar: { type: String, required: true },
  banned: [String],
  spaces_joined: {
    type: [String],
    validate: {
      validator: (spaces_joined) => (spaces_joined.length <= MAX_SPACES),
      message: `User cannot join more than ${MAX_SPACES} spaces`,
    },
  },
  spaces_created: {
    type: [String],
    validate: {
      validator: (spaces_created) => (spaces_created.length <= MAX_SPACES),
      message: `User cannot create more than ${MAX_SPACES} spaces`,
    },
  },
  reported: [
    {
      space_name: String,
      qty: Number,
    },
  ],
  reports: [
    {
      space_name: String,
      qty: Number,
    },
  ],
  reported_read: { type: Number, default: 0 },
});

exports.Users = mongoose.model('Users', usersSchema);

const spacesSchema = new mongoose.Schema(
  {
    space_name: { type: String, required: true, unique: true },
    created_by: { type: String, required: true, index: true },
    description: { type: String, default: 'default description' },
    guidelines: [String],
    members: [String],
  },
  { timestamps: true },
);

exports.Spaces = mongoose.model('Spaces', spacesSchema);

// const popsSchema = new mongoose.Schema(
//   {
//     username: { type: String, required: true, index: true },
//     pop_plop: { type: Boolean, required: true, index: true },
//   },
// );

// exports.Pops = mongoose.model('Pops', popsSchema);

const MAX_REPORTED = 100;
const commentsSchema = new mongoose.Schema(
  {
    created_by: { type: String, required: true },
    comment: { type: String, required: true },
    reported: {
      type: [String],
      validate: {
        validator: (reported) => (reported.length <= MAX_REPORTED),
        message: `The reported array can have a maximum of ${MAX_REPORTED} usernames`,
      },
    },
    pops_list: { type: Object, default: { } },
    plops_list: { type: Object, default: { } },
    reported_read: { type: Boolean, default: false },
  },
  { timestamps: true },
);
commentsSchema.plugin(AutoIncrement, { inc_field: 'comment_id' });

exports.Comments = mongoose.model('Comments', commentsSchema);

const confessionsSchema = new mongoose.Schema(
  {
    created_by: { type: String, required: true },
    confession: { type: String, required: true },
    reported: {
      type: [String],
      validate: {
        validator: (reported) => (reported.length <= MAX_REPORTED),
        message: `The reported array can have a maximum of ${MAX_REPORTED} usernames`,
      },
    },
    space_name: { type: String, required: true, index: true },
    hugs: { type: Number, default: 0, min: 0 },
    reported_read: { type: Boolean, default: false },
  },
  { timestamps: true },
);
confessionsSchema.plugin(AutoIncrement, { inc_field: 'confession_id' });

exports.Confessions = mongoose.model('Confessions', confessionsSchema);
