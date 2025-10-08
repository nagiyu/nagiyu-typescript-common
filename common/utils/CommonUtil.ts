import { randomUUID } from "crypto";

export default class CommonUtil {
  public static generateUUID(): string {
    return randomUUID();
  }
}