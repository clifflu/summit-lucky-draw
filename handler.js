const DOMAIN = process.env.DOMAIN;

function wrapped(fp, successPath, failPath) {
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

module.exports = {
  register: wrapped(
    require("./src/register").register,
    "success.html",
    "again.html"
  )
};
