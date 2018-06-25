const DOMAIN = process.env.DOMAIN;

function promised(fp, successPath, failPath) {
  return (evt, ctx, cb) => {
    fp(evt, ctx)
      .then(data =>
        cb(null, {
          statusCode: 303,
          body: `Location: https://${DOMAIN}/${successPath}`
        })
      )
      .catch(err => {
        console.error(err);
        cb(null, {
          statusCode: 303,
          body: `Location: https://${DOMAIN}/${failPath}`
        });
      });
  };
}

module.exports = {
  register: promised(require("./src/register").register, "success.html", "again.html")
};
