// pages/credit-card.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function CreditCard() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('01');
  const [expiryYear, setExpiryYear] = useState(String(new Date().getFullYear()));
  const [cardHolder, setCardHolder] = useState('');
  const [amount, setAmount] = useState(1000);

  const [stage, setStage] = useState('input');  // 'input' | '3ds' | 'result'
  const [result, setResult] = useState(null);

  // Zeus SDK（セキュリティコードなし版）ロード
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://linkpt.cardservice.co.jp/api/token/2.0/zeus_token2.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);
  // 3DS のコールバック設定
  useEffect(() => {
    window._onPaResSuccess = async ({ MD: xid, PaRes: paRes }) => {
      try {
        // AuthReq → AuthRes
        const auth = await fetch('/api/payment-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'auth', md: xid, PaRes: paRes })
        });
        const authJson = await auth.json();
        if (authJson.result?.status !== 'success') {
          throw new Error(`Auth失敗: ${authJson.result?.code}`);
        }

        // PayReq → PayRes
        const pay = await fetch('/api/payment-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'payment', md: xid })
        });
        const payJson = await pay.json();

        setResult(payJson);
        setStage('result');
      } catch (e) {
        alert('決済処理エラー: ' + e.message);
        setStage('input');
      }
    };
    window._onError = (err) => {
      alert('3D認証エラー: ' + (err.message || JSON.stringify(err)));
      setStage('input');
    };
  }, []);

  // 入力 → EnrolReq
  const handleSubmit = async e => {
    e.preventDefault();
    setStage('3ds');
    try {
      const r = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber, expiryYear, expiryMonth, cardHolder, amount })
      });
      console.log("R: ", r);
      const { xid, paReq, iframeUrl } = await r.json();
      console.log("XID: ", xid);
      console.log("PAREQ: ", paReq);
      console.log("IFRAMEURL: ", iframeUrl);

      const termUrl = `${window.location.origin}/api/payment-result`;

      // 3DS iframe 表示
      window.setPareqParams(xid, paReq, termUrl, '2', iframeUrl);
    } catch (e) {
      alert('EnrolReqエラー: ' + e.message);
      setStage('input');
    }
  };

  if (stage === 'input') return (
    <>
      <Head><title>クレジットカード決済</title></Head>
      <div style={{ maxWidth:400, margin:'2rem auto' }}>
        <h2>カード情報入力</h2>
        <form onSubmit={handleSubmit}>
          <label>
            カード番号<br/>
            <input
              type="text" maxLength={16} required pattern="\d{14,16}"
              value={cardNumber} onChange={e => setCardNumber(e.target.value)}
              style={{ width:'100%' }}
            />
          </label>
          <label>
            有効期限<br/>
            <select value={expiryMonth} onChange={e=>setExpiryMonth(e.target.value)}>
              {[...Array(12)].map((_,i)=>{
                const m = String(i+1).padStart(2,'0');
                return <option key={m} value={m}>{m}</option>;
              })}
            </select>
            <select value={expiryYear} onChange={e=>setExpiryYear(e.target.value)}>
              {[...Array(10)].map((_,i)=>{
                const y = new Date().getFullYear()+i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </label>
          <label>
            名義人<br/>
            <input
              type="text" required
              value={cardHolder} onChange={e=>setCardHolder(e.target.value)}
              style={{ width:'100%' }}
            />
          </label>
          <label>
            金額（円）<br/>
            <input
              type="number" min={1} required
              value={amount} onChange={e=>setAmount(Number(e.target.value))}
              style={{ width:'100%' }}
            />
          </label>
          <button type="submit" style={{ marginTop:'1rem', width:'100%' }}>決済開始</button>
        </form>
      </div>
    </>
  );

  if (stage === '3ds') return (
    <>
      <Head><title>3Dセキュア認証中…</title></Head>
      <div style={{ textAlign:'center', margin:'2rem' }}>
        <div id="challenge_wait"><p>認証処理中…</p></div>
        <div id="3dscontainer" style={{ width:'100%', height:'450px', border:'1px solid #ddd' }}/>
      </div>
    </>
  );

  return (
    <>
      <Head><title>決済結果</title></Head>
      <div style={{ maxWidth:400, margin:'2rem auto' }}>
        <h2>決済結果</h2>
        <pre>{JSON.stringify(result,null,2)}</pre>
      </div>
    </>
  );
}