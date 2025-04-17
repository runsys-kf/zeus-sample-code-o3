// pages/api/payment.js
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const tokenEndpoint     = 'https://linkpt.cardservice.co.jp/cgi-bin/token/token.cgi';
const secureApiEndpoint = 'https://linkpt.cardservice.co.jp/cgi-bin/secure/api.cgi';

const clientip = '2019002175';
const key = '11da83f6e7ab803020e74be300ad3761d55f7f74';

// トークン発行リクエスト（仕様どおり <service>/<action> を子要素に、<cvv>000</cvv> を追加）
const generateTokenXml = (number, year, month, name) => {
  const m = month.toString().padStart(2,'0');
  return `<?xml version="1.0" encoding="utf-8"?>
<request service="token" action="newcard">
  <authentication>
    <clientip>${clientip}</clientip>
  </authentication>
  <card>
    <number>${number}</number>
    <expires>
      <year>${year || '2025'}</year>
      <month>${month}</month>
    </expires>
    <name>${name}</name>
  </card>
</request>`;
};

// EnrolReq 用 XML（変更なし）
const generateEnrolXml = (tokenKey, amount) => `<?xml version="1.0" encoding="utf-8"?>
<request service="secure_link_3d" action="enroll">
  <authentication>
    <clientip>${clientip}</clientip>
    <key>${key}</key>
  </authentication>
  <token_key>${tokenKey}</token_key>
  <payment>
    <amount>${amount}</amount>
    <count>01</count>
  </payment>
  <user>
    <telno validation="strict">09034343282</telno>
    <email language="japanese">onsen0514@gmail.com</email>
  </user>
  <uniq_key>
    <sendid>TEST0001</sendid>
  </uniq_key>
  <use_3ds2_flag>1</use_3ds2_flag>
</request>`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { cardNumber, expiryYear, expiryMonth, cardHolder, amount } = req.body;

    // --- Step 1: トークン発行 ---
    const tokenXml = generateTokenXml(cardNumber, expiryYear, expiryMonth, cardHolder);

    const tokenResp = await axios.post(tokenEndpoint, tokenXml, {
      headers: { 'Content-Type': 'application/xml' },
      responseType: 'text',
    });

    console.log('[Token Response Raw]:', tokenResp.data); // ★ デバッグ

    const tok = await parseStringPromise(tokenResp.data);
    const tokenKey = tok?.response?.token_key?.[0]
                  || tok?.response?.result?.[0]?.token_key?.[0];

    if (!tokenKey) throw new Error('Token発行失敗');

    // --- Step 2: EnrolReq ---
    const enrolXml = generateEnrolXml(tokenKey, amount);
    console.log('[Enrol Request XML]:\n', enrolXml); // ★ デバッグ
    const enrolResp = await axios.post(secureApiEndpoint, enrolXml, {
      headers: { 'Content-Type': 'application/xml' },
      responseType: 'text',
    });

    console.log('[Enrol Response Raw]:', enrolResp.data); // ★ デバッグ

    const er = await parseStringPromise(enrolResp.data);
    const rsp = er.response;
    const status = rsp.result?.[0]?.status?.[0];
    console.log("STATUS: ", status);
    if (status !== 'success') {
      const code = rsp.result?.[0]?.code?.[0] || 'unknown';
      throw new Error(`Enrol失敗 code=${code}`);
    }

    return res.status(200).json({
      xid: rsp.xid[0],
      paReq: 'PaReq',
      iframeUrl: decodeURIComponent(rsp.iframeUrl[0])
    });

  } catch (e) {
    console.error('Payment API error:', e);
    return res.status(500).json({ error: e.message });
  }
}