import { TimeType } from "@common/interfaces/TimeType";
import DateUtil from "./DateUtil";

export default class TimeUtil {
  public static formatTime(value: TimeType): string {
    return `${value.hour}:${value.minute.toString().padStart(2, '0')}`;
  }

  public static parseTime(value: string): TimeType {
    const [hour, minute] = value.split(':').map(Number);
    return { hour, minute };
  }

  /**
   * 現在のJST時刻から時間と分を取得
   */
  public static getCurrentJSTTime(): TimeType {
    const jstNow = DateUtil.nowInJST();
    return {
      hour: jstNow.hour(),
      minute: jstNow.minute()
    };
  }

  /**
   * 指定されたDateオブジェクトをJSTで解釈して時間と分を取得
   */
  public static getJSTTime(date: Date): TimeType {
    const jstDate = DateUtil.toJSTDayjs(date);
    return {
      hour: jstDate.hour(),
      minute: jstDate.minute()
    };
  }
}
