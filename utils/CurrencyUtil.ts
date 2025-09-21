export default class CurrencyUtil {
  // Fixed exchange rates
  private static readonly USD_TO_JPY_RATE = 143.0;
  private static readonly JPY_TO_USD_RATE = 0.007;

  /**
   * Convert USD to JPY
   * @param usdAmount Amount in USD
   * @returns Amount in JPY
   */
  public static convertUsdToJpy(usdAmount: number): number {
    return Math.round(usdAmount * this.USD_TO_JPY_RATE * 100) / 100;
  }

  /**
   * Convert JPY to USD
   * @param jpyAmount Amount in JPY
   * @returns Amount in USD
   */
  public static convertJpyToUsd(jpyAmount: number): number {
    return Math.round(jpyAmount * this.JPY_TO_USD_RATE * 100) / 100;
  }

  /**
   * Get current USD to JPY exchange rate
   * @returns USD to JPY exchange rate
   */
  public static getUsdToJpyRate(): number {
    return this.USD_TO_JPY_RATE;
  }

  /**
   * Get current JPY to USD exchange rate
   * @returns JPY to USD exchange rate
   */
  public static getJpyToUsdRate(): number {
    return this.JPY_TO_USD_RATE;
  }
}