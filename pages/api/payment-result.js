// pages/api/payment-result.js
require('dotenv').config();
import axios from 'axios';
import { Builder, parseStringPromise } from 'xml2js';
import { savePaymentResult, generatePaymentId } from '../../lib/payment-db';

const ZEUS_ENDPOINT = 'https://linkpt.cardservice.co.jp/cgi-bin/secure/api.cgi';
const builder = new Builder({ headless: true });

export default async function handler(req, res) {
  console.log('リクエストボディ:', req.body);
  // 環境変数またはデフォルト値を使用
  const clientIp = process.env.ZEUS_CLIENT_IP || '2019002175';
  const apiKey = process.env.ZEUS_KEY || '11da83f6e7ab803020e74be300ad3761d55f7f74';
  
  try {
    // zeus_token2.jsからのコールバック - MDとPaResを直接取得
    const { MD, PaRes, status } = req.body;
    
    console.log('MD:', MD);
    console.log('PaRes:', PaRes);
    console.log('status:', status);
    
    // MDとPaResが存在する場合（zeus_token2.jsからのコールバック）
    if (MD && PaRes) {
      console.log('zeus_token2.jsからのコールバックを処理');
      
      // 1. AuthReq - 認証結果確認
      const authReqObj = {
        request: {
          $: { service: 'secure_link_3d', action: 'authentication' },
          authentication: [
            {
              clientip: clientIp,
              key: apiKey
            }
          ],
          xid: [MD],
          PaRes: [PaRes]
        }
      };
      
      console.log('AuthReq作成');
      const authXml = '<?xml version="1.0" encoding="utf-8"?>' + builder.buildObject(authReqObj);
      console.log('AuthReq XML:', authXml);
      
      const authRes = await axios.post(ZEUS_ENDPOINT, authXml, {
        headers: { 'Content-Type': 'application/xml' }
      });
      
      const authParsed = await parseStringPromise(authRes.data);
      console.log('AuthRes結果:', authParsed);
      
      if (!authParsed.response?.result?.[0]?.status?.[0] || 
          authParsed.response.result[0].status[0] !== 'success') {
        console.error('認証失敗:', authParsed.response?.result?.[0]);
        return res.status(400).json({ 
          error: '認証失敗', 
          code: authParsed.response?.result?.[0]?.code?.[0] || 'unknown' 
        });
      }
      
      // 2. PayReq - 決済実行
      const payReqObj = {
        request: {
          $: { service: 'secure_link_3d', action: 'payment' },
          authentication: [
            {
              clientip: clientIp,
              key: apiKey
            }
          ],
          xid: [MD],
          print_am: ['yes'],
          print_addition_value: ['yes']
        }
      };
      
      console.log('PayReq作成');
      const payXml = '<?xml version="1.0" encoding="utf-8"?>' + builder.buildObject(payReqObj);
      console.log('PayReq XML:', payXml);
      
      const payRes = await axios.post(ZEUS_ENDPOINT, payXml, {
        headers: { 'Content-Type': 'application/xml' }
      });
      
      const payParsed = await parseStringPromise(payRes.data);
      console.log('PayRes結果:', payParsed);
      
      if (!payParsed.response?.result?.[0]?.status?.[0] || 
          payParsed.response.result[0].status[0] !== 'success') {
        console.error('決済失敗:', payParsed.response?.result?.[0]);
        
        // エラーメッセージをマッピングする関数
        const getErrorMessage = (code) => {
          const errorMessages = {
            'errd001005': 'カード情報が正しくないか、このカードでは決済できません。',
            'errd001006': '残高不足または限度額超過です。',
            'errd001008': 'カード有効期限切れです。',
            'errd001009': '不正なカード番号です。',
            'errd001010': 'このカードは利用できません。',
            'errm001001': '3Dセキュア認証に失敗しました。',
            'default': '決済処理中にエラーが発生しました。'
          };
          return errorMessages[code] || errorMessages.default;
        };
        
        // エラー情報を含む決済結果を保存
        const paymentId = generatePaymentId();
        const errorCode = payParsed.response?.result?.[0]?.code?.[0] || 'unknown';
        const paymentData = {
          status: 'failed', // success ではなく failed
          error_code: errorCode,
          error_message: getErrorMessage(errorCode),
          transaction_id: payParsed.response?.order_number?.[0] || '-',
          amount: req.body.amount || '不明',
          timestamp: new Date().toISOString()
        };
        
        savePaymentResult(paymentId, paymentData);
        
        // エラー結果も決済結果確認画面で表示するため、同じ形式でリダイレクト
        return res.status(200).json({
          status: 'failed',
          payment_id: paymentId,
          redirect_url: `/payment-result?payment_id=${paymentId}`
        });
      }
      
      // 決済成功時、結果を保存してIDを返す
      const paymentId = generatePaymentId();
      const paymentData = {
        status: 'success',
        order_number: payParsed.response.order_number?.[0],
        amount: req.body.amount || '不明',
        card: {
          number: {
            prefix: payParsed.response.card?.[0]?.number?.[0]?.prefix?.[0] || '**',
            suffix: payParsed.response.card?.[0]?.number?.[0]?.suffix?.[0] || '****'
          }
        },
        am_data: {
          syonin: payParsed.response.am_data?.[0]?.syonin?.[0],
          denpyo: payParsed.response.am_data?.[0]?.denpyo?.[0]
        }
      };

      savePaymentResult(paymentId, paymentData);

      // 成功レスポンス（payment_idを含める）
      return res.status(200).json({
        status: 'success',
        payment_id: paymentId,
        redirect_url: `/payment-result?payment_id=${paymentId}`
      });
    }
    
    // 以前のstepベースのコード（互換性のために残しておく場合）
    console.error('無効なリクエスト形式');
    return res.status(400).json({ error: 'MDとPaResが必要です' });
  } catch (error) {
    console.error('処理エラー:', error);
    return res.status(500).json({ 
      error: '内部サーバーエラー',
      message: error.message || '不明なエラー' 
    });
  }
}
