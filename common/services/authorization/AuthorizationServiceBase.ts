import CacheUtil from '@common/utils/CacheUtil';
import { PermissionLevel } from '@common/enums/PermissionLevel';
import { UserType } from '@common/enums/UserType';
import { PermissionMatrix } from '@common/interfaces/authorization/PermissionMatrix';

/**
 * 汎用認可サービス基底クラス
 * 機能とレベルに基づいた権限チェックを提供します。
 * 各プロジェクトで継承して具体的な実装を提供してください。
 * 
 * @template Feature アプリケーション固有の機能の型（プロジェクトごとに定義）
 */
export abstract class AuthorizationServiceBase<Feature extends string = string> {
  private static readonly CACHE_PREFIX = 'user_permissions_';
  private static readonly CACHE_TTL = 300; // 5分（秒単位）

  /**
   * 権限レベルの階層定義
   * 上位の権限は下位の権限をすべて含みます
   */
  private static readonly LEVEL_HIERARCHY = [
    PermissionLevel.NONE,
    PermissionLevel.VIEW,
    PermissionLevel.EDIT,
    PermissionLevel.DELETE,
    PermissionLevel.ADMIN,
  ];

  /**
   * ユーザーが指定された機能に対して指定レベルの権限を持つかチェック
   * 
   * @param userType ユーザータイプ
   * @param feature 機能
   * @param requiredLevel 必要な権限レベル
   * @param userId ユーザーID（カスタム権限チェック用、オプション）
   * @returns 権限がある場合true
   */
  public async hasPermission(
    userType: UserType,
    feature: Feature,
    requiredLevel: PermissionLevel,
    userId?: string
  ): Promise<boolean> {
    // カスタム権限のチェック（ユーザーIDが指定されている場合）
    if (userId) {
      const customPermission = await this.getCustomPermission(userId, feature);
      if (customPermission !== null) {
        return this.comparePermissionLevel(customPermission, requiredLevel);
      }
    }

    // 権限マトリックスベースのチェック
    const permissionMatrix = await this.getPermissionMatrix();
    const userPermission = permissionMatrix[feature]?.[userType] || PermissionLevel.NONE;
    return this.comparePermissionLevel(userPermission, requiredLevel);
  }

  /**
   * 権限レベルの比較（階層を考慮）
   * 
   * @param userLevel ユーザーが持つ権限レベル
   * @param requiredLevel 必要な権限レベル
   * @returns ユーザーレベルが必要レベル以上の場合true
   */
  protected comparePermissionLevel(
    userLevel: PermissionLevel,
    requiredLevel: PermissionLevel
  ): boolean {
    const userLevelIndex = AuthorizationServiceBase.LEVEL_HIERARCHY.indexOf(userLevel);
    const requiredLevelIndex = AuthorizationServiceBase.LEVEL_HIERARCHY.indexOf(requiredLevel);

    return userLevelIndex >= requiredLevelIndex;
  }

  /**
   * 現在のユーザーが指定機能へのアクセス権限を持つかチェック
   * 
   * @param feature 機能
   * @param requiredLevel 必要な権限レベル
   * @returns 権限がある場合true
   */
  public async authorize(
    feature: Feature,
    requiredLevel: PermissionLevel
  ): Promise<boolean> {
    const userType = await this.getUserType();
    const userId = await this.getUserId();
    return this.hasPermission(userType, feature, requiredLevel, userId);
  }

  /**
   * ユーザーの権限をキャッシュから取得または読み込み
   * 
   * @param userId ユーザーID
   * @returns ユーザーの機能ごとの権限マップ
   */
  protected async getUserPermissions(userId: string): Promise<Map<Feature, PermissionLevel>> {
    const cacheKey = `${AuthorizationServiceBase.CACHE_PREFIX}${userId}`;
    
    // キャッシュチェック
    const cached = CacheUtil.get<Map<Feature, PermissionLevel>>(cacheKey);
    if (cached) {
      return cached;
    }

    // 権限を取得してキャッシュ
    const permissions = await this.loadUserPermissions(userId);
    CacheUtil.set(cacheKey, permissions, AuthorizationServiceBase.CACHE_TTL);

    return permissions;
  }

  /**
   * キャッシュをクリア
   * 
   * @param userId ユーザーID（指定した場合は特定ユーザーのみ、未指定の場合は全ユーザー）
   */
  protected clearCache(userId?: string): void {
    if (userId) {
      const cacheKey = `${AuthorizationServiceBase.CACHE_PREFIX}${userId}`;
      CacheUtil.delete(cacheKey);
    } else {
      // 全ユーザーのキャッシュをクリア
      CacheUtil.clearByPrefix(AuthorizationServiceBase.CACHE_PREFIX);
    }
  }

  /**
   * 権限マトリックスを取得（派生クラスで実装）
   * データベースや設定ファイルから権限マトリックスを取得する実装を提供してください。
   * 
   * @returns 権限マトリックス
   */
  protected abstract getPermissionMatrix(): Promise<PermissionMatrix<Feature>>;

  /**
   * ユーザータイプを取得（派生クラスで実装）
   * セッションやトークンからユーザータイプを判定する実装を提供してください。
   * 
   * @returns ユーザータイプ
   */
  protected abstract getUserType(): Promise<UserType>;

  /**
   * ユーザーIDを取得（派生クラスで実装）
   * セッションやトークンからユーザーIDを取得する実装を提供してください。
   * カスタム権限チェックに使用されます。
   * 
   * @returns ユーザーID（ログインしていない場合はundefined）
   */
  protected abstract getUserId(): Promise<string | undefined>;

  /**
   * ユーザーの権限を読み込む（派生クラスで実装）
   * データベースから特定ユーザーの権限情報を取得する実装を提供してください。
   * 
   * @param userId ユーザーID
   * @returns ユーザーの機能ごとの権限マップ
   */
  protected abstract loadUserPermissions(userId: string): Promise<Map<Feature, PermissionLevel>>;

  /**
   * ユーザー固有のカスタム権限を取得（派生クラスでオプション実装）
   * デフォルトではnullを返します。カスタム権限が必要な場合は上書きしてください。
   * 
   * @param userId ユーザーID
   * @param feature 機能
   * @returns カスタム権限レベル（設定されていない場合はnull）
   */
  protected async getCustomPermission(
    userId: string,
    feature: Feature
  ): Promise<PermissionLevel | null> {
    // デフォルト実装：カスタム権限なし
    return null;
  }
}
