import { ProcessEnvType } from '@common/consts/EnvironmentalConst';

export default class EnvironmentalUtil {
  public static GetProcessEnv(): ProcessEnvType {
    switch (process.env.PROCESS_ENV) {
      case 'local':
      case 'development':
      case 'production':
        return process.env.PROCESS_ENV as ProcessEnvType;
      default:
        return 'local';
    }
  }
}
