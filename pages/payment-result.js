import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PaymentResult() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // URLパラメータから決済IDを取得
  useEffect(() => {
    if (!router.isReady) return;
    
    const { payment_id } = router.query;
    if (!payment_id) {
      setError('決済IDが見つかりません');
      setLoading(false);
      return;
    }
    
    // 決済結果を取得
    fetchPaymentResult(payment_id);
  }, [router.isReady, router.query]);
  
  // 決済結果取得関数
  const fetchPaymentResult = async (paymentId) => {
    try {
      const response = await fetch(`/api/payment-status?id=${paymentId}`);
      if (!response.ok) {
        throw new Error(`決済結果の取得に失敗しました: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
      setLoading(false);
    } catch (err) {
      console.error('決済結果取得エラー:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  // ロード中表示
  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem' }}>
        <Head>
          <title>決済処理中...</title>
        </Head>
        <h2 style={{ textAlign: 'center' }}>決済結果を確認中...</h2>
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #ccc', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
            {/* スピナー */}
          </span>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  // エラー表示
  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem' }}>
        <Head>
          <title>決済エラー</title>
        </Head>
        <h2 style={{ textAlign: 'center', color: 'red' }}>決済処理中にエラーが発生しました</h2>
        <p style={{ textAlign: 'center' }}>{error}</p>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            onClick={() => router.push('/credit-card')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            決済ページに戻る
          </button>
        </div>
      </div>
    );
  }
  
  // 決済結果表示
  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem' }}>
      <Head>
        <title>決済結果</title>
      </Head>
      <h1 style={{ textAlign: 'center' }}>決済結果</h1>
      
      {result.status === 'success' ? (
        <div style={{ border: '1px solid #ddd', padding: '1rem', marginTop: '1rem' }}>
          <h2 style={{ color: 'green', textAlign: 'center' }}>決済が完了しました</h2>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              <span>オーダー番号:</span>
              <span>{result.order_number || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              <span>カード番号:</span>
              <span>{result.card?.number?.prefix || ''}******{result.card?.number?.suffix || ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              <span>決済金額:</span>
              <span>{result.amount || '-'}円</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              <span>承認番号:</span>
              <span>{result.am_data?.syonin || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span>伝票番号:</span>
              <span>{result.am_data?.denpyo || '-'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid #ddd', padding: '1rem', marginTop: '1rem' }}>
          <h2 style={{ color: '#e74c3c', textAlign: 'center' }}>決済が完了できませんでした</h2>
          
          <p style={{ textAlign: 'center', margin: '1.5rem 0', fontSize: '1.1rem' }}>
            {result.error_message || '決済処理中に問題が発生しました。'}
          </p>
          
          {result.transaction_id && (
            <div style={{ margin: '1rem 0', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <p style={{ margin: '0.5rem 0' }}><strong>取引ID:</strong> {result.transaction_id}</p>
              {result.amount && <p style={{ margin: '0.5rem 0' }}><strong>決済金額:</strong> {result.amount}円</p>}
              <p style={{ margin: '0.5rem 0' }}><strong>日時:</strong> {new Date(result.timestamp).toLocaleString('ja-JP')}</p>
            </div>
          )}
          
          <div style={{ margin: '1.5rem 0', padding: '1rem', backgroundColor: '#fff8e1', borderRadius: '4px', borderLeft: '4px solid #ffc107' }}>
            <p style={{ marginBottom: '0.5rem' }}><strong>次の操作をお試しください:</strong></p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li>カード情報を確認して、再度お試しください</li>
              <li>別のカードでのお支払いをお試しください</li>
              <li>決済に関してご不明な点があれば、カスタマーサポートまでお問い合わせください</li>
            </ul>
          </div>
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button 
          onClick={() => router.push('/')}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          トップページへ戻る
        </button>
      </div>
    </div>
  );
} 