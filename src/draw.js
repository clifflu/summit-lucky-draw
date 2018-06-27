const AWS = require('aws-sdk')

const kmsKeyAlias = process.env.KMS_KEY_ALIAS;
const fromAddress = process.env.FROM_ADDRESS;
const regListName = process.env.REG_LIST;

function convertItem(item) {
    return {
        Submitted: Number.parseInt(item.Submitted.N),
        EEmail: item.EEmail.B,
        HEmail: item.HEmail.B,
        AcctId: Number.parseInt(item.AcctId.N),
    }
}

function convert(items) {
    return items.map(convertItem)
}

function dedupe(items) {
    let acct = new Set()
    let results = []

    for (let item of items) {
        if (item.AcctId in acct) {
            continue
        }

        acct.add(item.AcctId)
        results.push(item)
    }

    return results
}

function choiceOne(items) {
    return items[Math.floor(Math.random() * items.length)]
}

function peekOne() {
    let ddb = new AWS.DynamoDB()

    return ddb.scan({
        TableName: regListName
    })
        .promise()
        .then(results => results.Items)
        .then(convert)
        .then(dedupe)
        .then(choiceOne)
}

function decryptEEmail(eemail) {
    let kms = new AWS.KMS();

    let params = {
        CiphertextBlob: eemail
    };

    return kms
        .decrypt(params)
        .promise()
        .then(data => data.Plaintext.toString());

}

function sendMail(email) {
    let ses = new AWS.SES()

    let params = {
        Source: fromAddress,
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Subject: {
                Data: '測試訊息',
                Charset: 'UTF-8'
            },
            Body: {
                Html: {
                    Data: 'STRING_VALUE',
                    Charset: 'UTF-8'
                }
            }
        }
    }

    return ses.sendEmail(params)
        .promise()
        .then(console.log)

}

function mailOne(item) {
    return decryptEEmail(item.EEmail)
        // .then(sendMail)
        .then(email => console.log({email}))
        .then(_ => item)
}

function deleteOne(item) {
    let ddb = new AWS.DynamoDB()

    return ddb.deleteItem({
        TableName: regListName,
        Key: {
            HEmail: {
                B: item.HEmail
            }
        }
    }).promise()
}

function one() {
    return peekOne()
        .then(mailOne)
        .then(deleteOne)
}

module.exports = {
    peekOne,
    one,
}