// lib/payment-db.js
// 注: これは簡易的な実装です。実際のアプリケーションでは、
// データベースまたは永続的なストレージを使用してください。

// メモリ内のデータストア（開発用）
const paymentResults = new Map();

/**
 * 決済結果を保存する
 * @param {string} id - 決済ID
 * @param {object} result - 決済結果オブジェクト
 */
export function savePaymentResult(id, result) {
  paymentResults.set(id, {
    ...result,
    timestamp: new Date().toISOString()
  });
  return id;
}

/**
 * 決済IDから決済結果を取得する
 * @param {string} id - 決済ID
 * @returns {object|null} 決済結果、存在しない場合はnull
 */
export async function getPaymentResultById(id) {
  return paymentResults.get(id) || null;
}

/**
 * 一意の決済IDを生成する
 * @returns {string} 決済ID
 */
export function generatePaymentId() {
  return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
} 