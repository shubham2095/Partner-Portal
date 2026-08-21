export function calculateCommissionAmount(saleValue, rateType, rateValue) {
  const sale = Number(saleValue)
  const rate = Number(rateValue)

  if (rateType === 'FIXED') {
    return Math.round(rate * 100) / 100
  }

  // PERCENTAGE
  const amount = (sale * rate) / 100
  return Math.round(amount * 100) / 100
}
