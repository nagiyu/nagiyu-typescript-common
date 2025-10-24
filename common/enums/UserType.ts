/**
 * ユーザータイプ（User Type）
 * システムを利用するユーザーのカテゴリを表します。
 */
export enum UserType {
  /** 未ログインユーザー */
  GUEST = 'guest',
  /** ログイン済みユーザー */
  AUTHENTICATED = 'authenticated',
  /** プレミアムユーザー（将来的な拡張用） */
  PREMIUM = 'premium',
  /** 管理者 */
  ADMIN = 'admin',
}
