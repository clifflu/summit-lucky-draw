
function register(evt, ctx, cb) {
  const response = {
    statusCode: 200,
    body: JSON.stringify({evt}),
  };

  cb(null, response);
}

function verify(evt, ctx, cb) {
  const response = {
    statusCode: 200,
    body: JSON.stringify({evt}),
  };

  cb(null, response);
}

module.exports = {
  register, 
  verify,
}
