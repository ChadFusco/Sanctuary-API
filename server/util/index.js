const admin = require('firebase-admin');

exports.generateFilter = (filter, exact) => {
  if (!filter) return /./;
  return exact ? filter : new RegExp(filter, 'i');
};

exports.authenticate = (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.status(403).send('Unauthorized');
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  return admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    })
    .catch((err) => {
      res.status(403).send(`Unauthorized: ${err}`);
    });
};
