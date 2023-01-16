const mongoose = require('mongoose');

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
      space_name: { type: String },
      qty: Number,
    },
  ],
  reports: [
    {
      space_name: { type: String },
      qty: Number,
    },
  ],
});

const Users = mongoose.model('Users', usersSchema);

const spacesSchema = new mongoose.Schema(
  {
    space_name: { type: String, required: true, unique: true },
    created_by: { type: String, required: true },
    user_count: { type: Number, default: 0 },
    description: { type: String, default: 'default description' },
    guidelines: [String],
    members: [String],
  },
  { timestamps: true },
);

const Spaces = mongoose.model('Users', spacesSchema);

const commentsSchema = new mongoose.Schema(
  {
    comment_id: Number,
    created_by: { type: String, required: true },
    comment: { type: String, required: true },
    reported: [String],
    pops: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

const Comments = mongoose.model('Comments', commentsSchema);

const confessionsSchema = new mongoose.Schema(
  {
    confession_id: Number,
    created_by: { type: String, required: true },
    confession: { type: String, required: true },
    reported: [String],
    space_name: { type: [String], index: true },
    hugs: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

const Confessions = mongoose.model('Confessions', confessionsSchema);

// let startingAnswers = [
//   { answerID: 1 },
//   { answerID: 2 },
// ];

// Answers.countDocuments({}, (err, count) => {
//   if (!count) {
//     Answers.insertMany(startingAnswers, function(err) {
//       if (err) {
//         console.log('err:', err);
//       } else {
//         console.log('startingAnswers successfully saved!')
//       }
//     })
//   }
// })

// module.exports = Answers;
