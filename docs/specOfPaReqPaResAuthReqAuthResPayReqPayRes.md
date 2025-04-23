【PaReq/PaRes】
EMV 3-Dセキュア認証判定処理（EnrolRes）からの後続処理として、リスク判定と認証を行います。

【EMV 3-Dセキュア リスク判定〜認証リクエスト仕様】
EnrolResから受け取ったパラメータを引数として、JavaScript関数「setPareqParams」を記載してください。
この関数は弊社JavaScriptファイルから実行されます。

// PaReq送信に必要なパラメータを設定する関数
setPareqParams(md, paReq, termUrl, threeDSMethod, iframeUrl);

引数一覧と設定内容：
1. md
   - EnrolResで取得した response > xid
   - 例: md = enrolRes.response.xid
2. paReq
   - 固定値 "PaReq"
   - 例: paReq = "PaReq"
3. termUrl
   - 認証結果を受け取るURL（任意設定可能）
   - 例: termUrl = "https://your-domain.com/3ds/term"
   - ※ セッションキーなどの情報を含めることも可能
4. threeDSMethod
   - 固定値 "2"
   - 例: threeDSMethod = "2"
5. iframeUrl
   - EnrolResで取得した response > iframeUrl
   - 例: iframeUrl = enrolRes.response.iframeUrl

補足：
この関数はZEUS提供のJavaScriptファイル内から呼び出される想定。
旧提供システムのPaReq送信相当の処理として実行される。

【EMV 3-Dセキュア リスク判定～認証レスポンス仕様（PaRes）】
PaReqの「termUrl」に指定したURLに対して弊社JavaScriptで非同期通信が行われます。
以下パラメーターが送信されるため、termUrlで指定したプログラムで後続処理を実行してください。

[リクエスト方法]
接続先:
  termUrl で指定したURL
通信プロトコル:
  HTTPS
Content-Type:
  application/json

[送信されるパラメータ]
1. MD
   - 内容: PaReqの取得したパラメータ "md"
2. PaRes
   - 内容: 認証の結果コード
     - "Y" 認証成功
     - "N" 認証拒否
3. status
   - 内容: 認証処理のステータス
     - "success" 認証成功
       → 認証成功なので、AuthReqへ進めてください。
     - "failure" 認証拒否
       → カード会社により認証拒否。決済失敗画面を表示。AuthReqには進まず、処理を終了。
     - "invalid" 入力内容エラー
       → 入力内容に誤り。決済失敗画面を表示。AuthReqには進まず、処理を終了。
     - "maintenance" エラー発生（ゼウスメンテナンス）
       → 決済失敗画面を表示。AuthReqには進まず、処理を終了。

---
【AuthReq/認証結果取得リクエストXML】
PaRes認証結果をEMV 3-Dセキュアで送信するためのリクエスト仕様です。

【XML要素】
<request>
  <service>secure_link_3d</service>       // 固定値
  <action>authentication</action>         // 固定値
  <xid>                                    // PaResのパラメータ「MD」
    ABCDEFabcdef1234567890<%64%64%64...    // 半角英数 86byte
  </xid>
  <PaRes>Y</PaRes>                         // 固定値「Y」または「N」
</request>

【XMLサンプル】
<?xml version="1.0" encoding="utf-8"?>
<request service="secure_link_3d" action="authentication">
  <xid>ABCDEFabcdef1234567890<%64%64%64%64%64%64%64...</xid>
  <PaRes>Y</PaRes>
</request>

---

【AuthRes/認証結果レスポンスXML】
AuthReqに対する認証結果の応答仕様です。

【XML要素】
<response>
  <service>secure_link_3d</service>       // 固定値
  <action>authentication</action>         // 固定値
  <result>
    <status>success</status>              // 認証結果: success, failure, invalid, maintenance
    <code>002</code>                      // エラーコード（10byte以下）
  </result>
</response>

【XMLサンプル】
<?xml version="1.0" encoding="utf-8"?>
<request service="secure_link_3d" action="authentication">
  <result>
    <status>success</status>
    <code>002</code>
  </result>
</request>

---

【PayReq/オーソリ処理リクエストXML】
与信照会を行い、決済を実行するリクエスト仕様です。

【XML要素】
<request>
  <service>secure_link_3d</service>       // 固定値
  <action>payment</action>                // 固定値
  <xid>ABCDEFabcdef1234567890</xid>       // PaResのMD
  <print_am>yes</print_am>                // yes指定で伝票情報取得可
  <print_addition_value>yes</print_addition_value> // yes指定で詳細追加項目取得可
</request>

【XMLサンプル】
<?xml version="1.0" encoding="utf-8"?>
<request service="secure_link_3d" action="payment">
  <xid>ABCDEFabcdef1234567890</xid>
  <print_am>yes</print_am>
  <print_addition_value>yes</print_addition_value>
</request>

---

【PayRes/オーソリ処理レスポンスXML】
決済の結果を返すレスポンス仕様です。

【XML要素】
<response>
  <service>secure_link_3d</service>
  <action>payment</action>
  <result>
    <status>success</status>               // success, failure, invalid, maintenance
    <code>000</code>                       // エラーコード
  </result>
  <order_number>11.111.11.11-000-222-333</order_number>  // オーダーNo
  <card>
    <number>
      <prefix>41</prefix>                  // カード番号上2桁
      <suffix>1111</suffix>                // カード番号下4桁
    </number>
    <expires>
      <year>2025</year>                    // 有効期限（年）
      <month>01</month>                    // 有効期限（月）
    </expires>
  </card>
  <am_data>
    <syonin>999999</syonin>                // 承認番号
    <denpyo>99999</denpyo>                 // 伝票番号
    <merchantno>999999999999999</merchantno> // 加盟店番号
  </am_data>
  <addition_value>
    <div>01</div>                          // 支払回数
    <ctype>V</ctype>                       // カードブランド
    <cardsend>99999999999</cardsend>       // 仕向け先コード
    <sendid>CARD000001</sendid>            // EnrolReqで送信したsendid
    <sendpoint>TEST</sendpoint>            // EnrolReqで送信したsendpoint
  </addition_value>
</response>
