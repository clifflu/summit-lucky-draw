const DOMAIN = process.env.DOMAIN

function promised(fp, redirPath) {
  return (evt, ctx, cb) => {
    fp(evt, ctx)
      .then(data =>
        cb(null, {
          statusCode: 303,
          body: `Location: https://${DOMAIN}/${redirPath}`,
        })
      )
      .catch(err => {
        console.error(err);
        cb(null, {
          statusCode: 400,
          body: "Bad request",
        });
      });
  };
}

module.exports = {
  register: promised(require("./src/register").register, 'ack.html'),
  verify: promised(require("./src/verify").verify, 'success.html'),
};
