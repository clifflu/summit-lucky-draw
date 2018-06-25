const AWS = require("aws-sdk");
const crypto = require("crypto");
const querystring = require("querystring");

const hKey = Buffer.from(process.env.H_KEY);
const kmsKeyAlias = process.env.KMS_KEY_ALIAS;
const regListName = process.env.REG_LIST;
const verifierArn = process.env.VERIFIER_ARN;

const due = Date.parse("2018-06-28T07:00:00Z");

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
    email: checkUgcEmail(payload.ugc.email)
  };

  return Object.assign(payload, { input });
}

function verifyRole(payload) {
  let sts = new AWS.STS();

  return sts
    .assumeRole({
      RoleArn: verifierArn,
      RoleSessionName: "summit18-lucky-draw"
    })
    .promise()
    .then(ret => {
      let sts = new AWS.STS({
        accessKeyId: ret.Credentials.AccessKeyId,
        secretAccessKey: ret.Credentials.SecretAccessKey,
        sessionToken: ret.Credentials.SessionToken
      });

      return sts
        .assumeRole({
          RoleArn: payload.input.roleArn,
          RoleSessionName: "summit18-lucky-draw"
        })
        .promise()
        .catch(err => {
          throw new Error("AssumeRole (user) failed");
        });
      // Clear error stack / msg to prevent info leak
    })
    .then(_ => payload);
}

function processInputHmac(src) {
  const hmac = crypto.createHmac("sha256", hKey);
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
        Submitted: { N: String(Date.now()) }
      }
    })
  );
}

function saveRecord(payload) {
  let ddb = new AWS.DynamoDB();
  let params = {
    TableName: regListName,
    Item: payload.item
  };

  return ddb
    .putItem(params)
    .promise()
    .then(_ => payload);
}

function register(evt, ctx) {
  if (Date.now() > due) {
    return Promise.reject("due");
  }

  let tmp = querystring.parse(evt.body);
  let ugc = { roleArn: tmp.roleArn, email: tmp.email };

  return Promise.resolve({ ugc })
    .then(checkUgc)
    .then(verifyRole)
    .then(processInput)
    .then(saveRecord)
}

module.exports = {
  register
};
