# summit-lucky-draw

For AWS User Group lucky draw at Summit '18 Taipei.

## Requirements

* [Node.js]()
* [Serverless Framework](https://serverless.com/)
* [serverless-finch](https://github.com/fernando-mc/serverless-finch)


## Deploy

```
serverless client deploy
serverless deploy
```

## Exposed URI

* /index.html 註冊頁面，檢視活動、隱私說明，並透過表單輸入 Email 表示同意
* /api/register 檢查能否正確 AssumeRole；若成功轉址至 success.html，否則 again.html
* /success.html 顯示成功頁面
* /again.html 顯示失敗頁面
* /error.html HTTP error page
