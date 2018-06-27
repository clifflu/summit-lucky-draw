const DOMAIN = process.env.DOMAIN;

function wrappedWebRequest(fp, successPath, failPath) {
  function redir(path, cb) {
    cb(null, {
      statusCode: 303,
      headers: {
        location: `https://${DOMAIN}/${path}`
      }
    });
  }

  return (evt, ctx, cb) => {
    fp(evt, ctx)
      .then(_ => redir(successPath, cb))
      .catch(err => {
        console.error(err);
        redir(failPath, cb);
      });
  };
}

function drawOne (evt, ctx, cb) {
  return require('./src/draw').one()
    .then(data => cb(null, data))
    .catch(cb)
}

module.exports = {
  register: wrappedWebRequest(
    require("./src/register").register,
    "success.html",
    "again.html"
  ),
  drawOne
};
