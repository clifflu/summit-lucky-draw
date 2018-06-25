
const AWS = require('aws-sdk')
const querystring = require('querystring')

const DOMAIN = process.env.DOMAIN || 'summit18.awsug.tw'

function extractRoleArn(s) {
  s = s.trim()

  // Use alphanumeric and '+=,.@-_' characters. Maximum 64 characters.
  let roleRegex = /^arn:aws:iam::\d{12}:role\/[\w\d+=,.@\-_]{1,64}$/

  if (roleRegex.test(s)) {
    return s
  }

  throw new Error('Invalid Arn')
}

function extractEmail(s) {
  s = s.trim()
  if (/^.+@.+$/.test(s)) {
    // valid Email address
    return s
  } 

  throw new Error('Invalid email')
}

function checkUgc(payload) {
  let roleArn = extractRoleArn(payload.ugc.roleArn)
  let email = extractEmail(payload.ugc.email)

  return Object.assign(payload, {input: {roleArn, email}})
}

function saveRecord(payload) {
  return payload
}

function register(evt, ctx) {
  let tmp = querystring.parse(evt.body)
  let ugc = {roleArn: tmp.roleArn, email: tmp.email}

  return Promise.resolve({ugc})
    .then(checkUgc)
    .then(saveRecord)
}

function _register(evt, ctx, cb) {
  register(evt, ctx)
    .then(data => cb(null, {
      statusCode: 303, 
      body: `Location: https://${DOMAIN}/ack.html`
    }))
    .catch(err => {
      console.error(err)
      cb(null, {
        statusCode: 400,
        body: 'Bad request'
      })
    })
}

module.exports = _register
