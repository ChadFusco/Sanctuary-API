// REQUIRE STATEMENTS
const app = require('./server');

// PORT AND SERVER LISTEN
const PORT = process.env.PORT || 80;
const server = app.listen(PORT, () => console.log(`Server listening at http://localhost:${PORT}`));
server.setTimeout(20000);
