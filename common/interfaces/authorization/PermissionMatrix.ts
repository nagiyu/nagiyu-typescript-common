import { PermissionLevel } from '@common/enums/PermissionLevel';
import { UserType } from '@common/enums/UserType';
import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';

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
export interface PermissionMatrixRecord<Feature extends string = string> extends RecordTypeBase {
  /** データタイプ（固定値） */
  DataType: 'PermissionMatrix';
  /** 権限マトリックスデータ */
  Matrix: PermissionMatrix<Feature>;
}
