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

* /register.html 註冊頁面，檢視活動、隱私說明，並透過表單輸入 Email 表示同意
* /api/register 接收 Email，發送認證信；其中包含註冊碼、指向 /api/verify 之連接，並提示在建完 Role 後再點擊連接
* /api/verify 查驗簽章，檢查能否正確 AssumeRole；若失敗則回應錯誤訊息，否則記錄至 DynamoDB 並 redirect
* /success.html 顯示成功頁面

