const router = (app, path) => {
  app.get('/', (req, res) => {
    res.render('index');
  });
};

module.exports = router;