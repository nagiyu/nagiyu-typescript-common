import { PermissionLevel } from '@common/enums/PermissionLevel';
import { UserType } from '@common/enums/UserType';

/**
 * 権限マトリックスの型定義
 * 機能とユーザータイプの組み合わせで、各ユーザータイプが持つ権限レベルを定義します。
 * 
 * @template Feature アプリケーション固有の機能の型（プロジェクトごとに定義）
 */
export type PermissionMatrix<Feature extends string = string> = {
  [feature in Feature]: {
    [userType in UserType]: PermissionLevel;
  };
};

/**
 * 権限マトリックスレコードの型定義
 * データベースに保存する際の構造を定義します。
 * 
 * @template Feature アプリケーション固有の機能の型（プロジェクトごとに定義）
 */
export interface PermissionMatrixRecord<Feature extends string = string> {
  /** レコードID */
  Id: string;
  /** データタイプ */
  DataType: string;
  /** 権限マトリックスデータ */
  Matrix: PermissionMatrix<Feature>;
  /** 作成日時（Unix timestamp） */
  Create: number;
  /** 更新日時（Unix timestamp） */
  Update: number;
}
