import { DataTypeBase } from "@common/interfaces/data/DataTypeBase";

export interface AuthDataType extends DataTypeBase {
  name: string;
  googleUserId: string;
}
