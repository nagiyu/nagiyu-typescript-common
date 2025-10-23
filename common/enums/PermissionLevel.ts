/**
 * 権限レベル（Permission Level）
 * 各機能に対する操作の種類を表します。
 */
export enum PermissionLevel {
  /** アクセス不可 */
  NONE = 'none',
  /** 閲覧のみ */
  VIEW = 'view',
  /** 編集可能（閲覧も含む） */
  EDIT = 'edit',
  /** 削除可能（編集・閲覧も含む） */
  DELETE = 'delete',
  /** 管理者権限（すべての操作が可能） */
  ADMIN = 'admin',
}
