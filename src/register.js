const AWS = require("aws-sdk");
const crypto = require("crypto");
const querystring = require("querystring");
const util = require("util");

const kmsKeyAlias = process.env.kmsKeyAlias;

function checkUgcRoleArn(s) {
  s = s.trim();

  // Use alphanumeric and '+=,.@-_' characters. Maximum 64 characters.
  let roleRegex = /^arn:aws:iam::\d{12}:role\/[\w\d+=,.@\-_]{1,64}$/;

  if (roleRegex.test(s)) {
    return s;
  }

  throw new Error("Invalid Arn");
}

function checkUgcEmail(s) {
  s = s.trim();
  if (/^.+@.+$/.test(s)) {
    // valid Email address
    return s;
  }

  throw new Error("Invalid email");
}

function checkUgc(payload) {
  let input = {
    roleArn: checkUgcRoleArn(payload.ugc.roleArn),
    email: checkUgcEmail(payload.ugc.email),
    when: payload.ugc.when
  };

  return Object.assign(payload, { input });
}

function processInputHmac(src) {
  let hkey = Buffer.from(process.env.hkey);
  const hmac = crypto.createHmac("sha256", hkey);
  hmac.update(src);

  return hmac.digest();
}

function processInputEncrypt(src) {
  let kms = new AWS.KMS();

  let params = {
    KeyId: kmsKeyAlias,
    Plaintext: Buffer.from(src)
  };

  return kms
    .encrypt(params)
    .promise()
    .then(data => data.CiphertextBlob);
}

function processInputAcctId(src) {
  return src.split(":")[4];
}

function processInput(payload) {
  let email = payload.input.email;
  let roleArn = payload.input.roleArn;

  return Promise.all([
    processInputHmac(email),
    processInputEncrypt(email),
    processInputAcctId(roleArn)
  ]).then(([hEmail, eEmail, acctId]) =>
    Object.assign(payload, {
      item: {
        HEmail: { B: hEmail },
        EEmail: { B: eEmail },
        AcctId: { N: acctId },
        Submitted: { N: String(payload.input.when) }
      }
    })
  );
}

function saveRecord(payload) {
  let ddb = new AWS.DynamoDB();

  console.log(util.inspect({ payload }, { depth: null }));
  return payload;
}

function register(evt, ctx) {
  let tmp = querystring.parse(evt.body);
  let ugc = { roleArn: tmp.roleArn, email: tmp.email, when: tmp.when };

  return Promise.resolve({ ugc })
    .then(checkUgc)
    .then(processInput)
    .then(saveRecord);
}

module.exports = {
  register
};
