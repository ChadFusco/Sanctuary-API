const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const AutoIncrement = require('mongoose-sequence')(mongoose);

mongoose.set('strictQuery', true);

mongoose.connect('mongodb://localhost:27017/sanctuary');

const usersSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  avatar: { type: String, required: true },
  banned: [String],
  spaces_joined: [String],
  spaces_created: [String],
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

const popsSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, index: true },
    pop_plop: { type: Boolean, required: true, index: true },
  },
);

exports.Pops = mongoose.model('Pops', popsSchema);

const commentsSchema = new mongoose.Schema(
  {
    created_by: { type: String, required: true },
    comment: { type: String, required: true },
    reported: [String],
    pops: { type: Number, default: 1 },
    pop_plop: [popsSchema],
  },
  { timestamps: true },
);
commentsSchema.plugin(AutoIncrement, { inc_field: 'comment_id' });

const confessionsSchema = new mongoose.Schema(
  {
    created_by: { type: String, required: true },
    confession: { type: String, required: true },
    reported: [String],
    space_name: { type: String, required: true, index: true },
    hugs: { type: Number, default: 0, min: 0 },
    comments: [commentsSchema],
  },
  { timestamps: true },
);
confessionsSchema.plugin(AutoIncrement, { inc_field: 'confession_id' });

exports.Confessions = mongoose.model('Confessions', confessionsSchema);
