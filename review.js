// 担当・許可条件は固定データで照合する。原文の意味との一致は判定しない。
export function evaluate(plan, ledger, comparison = 'exact') {
  const reasons = [];
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return ['構造化案はJSONオブジェクトにしてください'];
  const keys = ['customer', 'owner', 'field', 'operation', 'value', 'destination', 'to', 'cc', 'source'];
  if (Object.keys(plan).some(key => !keys.includes(key))) reasons.push('未対応の項目があります。1件の操作に分けてください');
  for (const key of keys.filter(key => !['to', 'cc'].includes(key))) {
    if (typeof plan[key] !== 'string') reasons.push(`${key}は文字列で指定してください（不足は空文字）`);
  }
  const customer = ledger.find(row => row.id === plan.customer);
  if (!customer || customer.owner !== '担当A') reasons.push('担当：固定台帳で担当AのC01〜C08に含まれません');
  if (!['対応状況', '次回連絡日'].includes(plan.field)) reasons.push('項目：対応状況・次回連絡日だけが許可されています');
  if (!['閲覧', '変更案の下書き保存', '確認依頼の模擬送信'].includes(plan.operation)) reasons.push('操作：許可外です。元台帳の更新・削除はできません');
  const destinationOK = typeof plan.destination === 'string' && (comparison === 'prefix' ? plan.destination.startsWith('社内下書き') : plan.destination === '社内下書き');
  if (!destinationOK) reasons.push('保存先：社内下書きの指定が必要です。完全一致では類似名も保留です');
  for (const key of ['to', 'cc']) {
    if (!Array.isArray(plan[key]) || plan[key].some(address => typeof address !== 'string')) reasons.push(`${key}：宛先は文字列の配列にしてください。不足は空配列`);
    else if (plan[key].some(address => address !== 'reviewer@office.example')) reasons.push(`${key}：許可外の宛先があります（CCも照合対象）`);
  }
  if (plan.operation === '確認依頼の模擬送信' && (!Array.isArray(plan.to) || !plan.to.length)) reasons.push('宛先：模擬送信のToが不足しています');
  if (plan.source !== '操作依頼') reasons.push('出所：操作依頼以外の指示には従えません。台帳内の文も対象です');
  if (plan.operation === '変更案の下書き保存' && (typeof plan.value !== 'string' || !plan.value.trim())) reasons.push('値：変更後の値が不足しています。推測で補いません');
  return reasons;
}
