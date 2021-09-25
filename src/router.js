
const router = (app, path) => {
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(`${__dirname}/../views/index.html`));
  });
  app.get('/client', (req, res) => {
    res.sendFile(path.resolve(`${__dirname}/../hosted/clientBundle.js`));
  });
};

module.exports = router;