import { getPaymentResultById } from '../../lib/payment-db';

export default async function handler(req, res) {
  // GETリクエストのみ受け付ける
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Payment ID is required' });
  }
  
  try {
    // 決済結果をデータベースから取得
    const paymentResult = await getPaymentResultById(id);
    
    if (!paymentResult) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    return res.status(200).json(paymentResult);
  } catch (error) {
    console.error('決済結果取得エラー:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 