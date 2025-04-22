【トークン発行リクエスト仕様（継続決済）】

ゼウス用意のJavaScriptをそのまま利用せず、独自でトークン発行を行う場合にご確認ください。

【接続先】
メソッド：POST
URL：https://linkpt.cardservice.co.jp/cgi-bin/token/token.cgi

【リクエスト仕様】
フォーマット：XML
文字コード　：UTF-8

【カスタマイズ版：トークン発行リクエスト仕様（カードID継続決済）】

お客様ご自身でJavaScriptを用意し、決済リクエストを送る時に必要となる「トークンキー」を取得する仕様です。
カード情報を入力せず、お客様環境に保存したsendidを利用した継続決済となります。

【トークン発行リクエストXML（継続決済）】

<request>
├─ service（ゼウス指定の文字列）……固定値「token」　必須：○　例：token
├─ action（ゼウス指定の文字列）……固定値「quick」　必須：○　例：quick
├─ authentication
│   └─ clientip（ゼウス発行のIPコード）……5 or 10桁の半角数字　必須：○　例：0000000000
└─ card
    └─ cvv（セキュリティコード）……3 or 4桁の半角数字　
        ※ VISA, MASTER, JCB, DINERS：3桁 / AMEX：4桁　
        ※ テストカード番号の場合は任意の3桁もしくは4桁でOK
        必須：※　例：000

【トークン発行リクエストサンプル（継続決済）】

<?xml version="1.0" encoding="utf-8"?>
<request service="token" action="quick">
    <authentication>
        <clientip>0000000000</clientip>
    </authentication>
    <card>
        <cvv>000</cvv>
    </card>
</request>
※セキュリティーコードの利用は不可にしているのでcvvの設定は不要

【トークン発行レスポンス仕様（継続決済）】

トークン発行リクエストを成功するとトークンキーが発行されます。
トークンキーは決済リクエストを送信する際に必要となります。

【レスポンス仕様】
フォーマット：XML
文字コード　：UTF-8

【トークン発行レスポンスパラメーター（継続決済）】

<response>
├─ service（ゼウス指定の文字列）……固定値「token」
├─ action（ゼウス指定の文字列）……固定値「quick」
└─ result
    ├─ status（トークンキー発行結果）
    │    ・success：トークンキー発行成功
    │    ・invalid：トークンキー発行失敗
    │    ・maintenance：メンテナンス中
    ├─ code（失敗時のエラーコード）※半角数字8byte　例：02130717
    ├─ token_key（成功時に発行されるトークンキー）※半角英数字記号86byte
    └─ masked_cvv（マスクされたセキュリティコード）
         ・VISA, MASTER, JCB, DINERS：***　
         ・AMEX：****

【トークン発行レスポンスサンプル（継続決済）】

■成功時：
<?xml version="1.0" encoding="utf-8"?>
<response service="token" action="quick">
    <result>
        <status>success</status>
        <token_key>XXXXXXXXXXXXXXXXXXXXXXXX</token_key>
        <masked_cvv>***</masked_cvv>
    </result>
</response>

■失敗時：
<?xml version="1.0" encoding="utf-8"?>
<response service="token" action="quick">
    <result>
        <status>invalid</status>
        <code>02130717</code>
    </result>
</response>

【EMV 3-Dセキュア認証判定リクエストXML仕様（カードID継続決済）】

カード情報を入力せず、お客様環境に保存したsendidを利用する場合のEMV 3-Dセキュア認証判定リクエスト仕様です。

【XML構造】
<request>
├─ service：ゼウス指定の文字列（固定値「secure_link_3d」）　必須 ○　例：secure_link_3d
├─ action：ゼウス指定の文字列（固定値「enroll」）　　　　　必須 ○　例：enroll
├─ authentication
│   ├─ clientip：ゼウス発行のIPコード（5 or 10byte）　　　　　必須 ○　例：0000000000
│   └─ key：ゼウス発行の認証キー（40byte）　　　　　　　　必須 ○　例：1AAABBBCCCDDDEEEFFFGGGHHH
├─ card
│   └─ history（メール送信有無）
│       ├─ action：固定値「send_email」　　　　　　　　　　　必須 ○　例：send_email
│       └─ key：検索条件key
│            ・sendidのみ：<key>sendid</key>
│            ・telnoのみ：<key>telno</key>
│            ・両方使用：<key>telno</key><key>sendid</key>
├─ token_key：トークン発行レスポンスで取得したキー（86byte）必須 ○　例：XXXXXXXXXXXXXXXXXXXX
├─ payment
│   ├─ amount：決済金額（7byte以下）　　　　　　　　　　　　　必須 ○　例：1000
│   └─ count：支払方法（2byte）　　　　　　　　　　　　　　　必須 ○　例：01
├─ user
│   ├─ telno：ユーザーの電話番号　　　　　　　　　　　　　　必須 ○　例：01234567890
│   ├─ validation：電話番号形式
│        ・strict（11byte以内、国内形式）例：strict
│        ・permissive（32byte以内、国内外可）例：permissive
│   ├─ email：メールアドレス（50byte以下）　　　　　　　　　必須 ○　例：xxxxxx@sbi-finsol.co.jp
│   └─ language：メールの言語（japanese / english）　　　　　　例：japanese
├─ uniq_key
│   ├─ sendid：カードID（半角英数字）　　　　　　　　　　　　例：CARD00001
│   └─ sendpoint：フリーパラメータ　　　　　　　　　　　　　例：TEST
└─ use_3ds2_flag：EMV 3-Dセキュア認証利用フラグ（固定値「1」）

【EMV 3-Dセキュア認証判定リクエストサンプル】

<?xml version="1.0" encoding="utf-8"?>
<request service="secure_link_3d" action="enroll">
    <authentication>
        <clientip>0000000000</clientip>
        <key>1AAABBBCCCDDDEEEFFFGGGHHH</key>
    </authentication>
    <card>
        <history action="send_email">
            <key>telno</key>
            <key>sendid</key>
        </history>
    </card>
    <token_key>XXXXXXXXXXXXXXXXXXXXXXXX</token_key>
    <payment>
        <amount>1000</amount>
        <count>01</count>
    </payment>
    <user>
        <telno validation="strict">01234567890</telno>
        <email language="japanese">xxxxxx@sbi-finsol.co.jp</email>
    </user>
    <uniq_key>
        <sendid>CARD00001</sendid>
        <sendpoint>TEST</sendpoint>
    </uniq_key>
    <use_3ds2_flag>1</use_3ds2_flag>
</request>

【EMV 3-Dセキュア認証レスポンス仕様】

<response>
├─ service：ゼウス指定の文字列（固定値「secure_link_3d」）
├─ action：ゼウス指定の文字列（固定値「enroll」）
└─ result
    ├─ status：認証結果
    │    ・success：認証成功 → PaReqへ進む
    │    ・outside：EMV3-Dセキュア非対応ブランド（通常オーソリ実行）
    │    ・failure：認証拒否 → 決済失敗画面へ
    │    ・invalid：入力内容エラー → 決済失敗画面へ
    │    ・maintenance：メンテナンス中 → 決済失敗画面へ
    ├─ code：エラーコード（10byte以下）
    ├─ xid：トランザクションの一意キー（半角英数字）
    ├─ threeDS2flag：カードの認証種別（固定値「1」）
    └─ iframeUrl：ブラウザ情報取得用のURL（JavaScriptでデコード）

【EMV 3-Dセキュア認証レスポンスサンプル】

<?xml version="1.0" encoding="utf-8"?>
<response service="secure_link_3d" action="enroll">
    <result>
        <status>success</status>
        <code>001</code>
    </result>
    <xid>ABCDEFabcdef1234567890</xid>
    <threeDS2flag>1</threeDS2flag>
    <iframeUrl>https://foo/bar/</iframeUrl>
</response>
