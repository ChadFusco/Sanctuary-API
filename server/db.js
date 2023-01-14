const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

mongoose.connect('mongodb://localhost:27017/answers');

// const answerSchema = new mongoose.Schema({
//   answerID: { type: Number, required: true, unique: true},
// })

// const Answers = mongoose.model('Answers', answerSchema);

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
