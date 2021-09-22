
const router = (app, path) => {
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(`${__dirname}/../client/index.html`));
  });
  app.get('/client', (req, res) => {
    res.sendFile(path.resolve(`${__dirname}/../client/client.js`));
  });
};

module.exports = router;