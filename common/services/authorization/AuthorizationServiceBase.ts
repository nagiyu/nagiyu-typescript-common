import { BadRequestError } from '@common/errors';
import { PermissionLevel } from '@common/enums/PermissionLevel';
import { PermissionMatrix } from '@common/interfaces/authorization/PermissionMatrix';
import { UserType } from '@common/enums/UserType';

/**
 * 汎用認可サービス基底クラス
 * 機能とレベルに基づいた権限チェックを提供します。
 * 各プロジェクトで継承して具体的な実装を提供してください。
 * 
 * @template Feature アプリケーション固有の機能の型（プロジェクトごとに定義）
 */
export abstract class AuthorizationServiceBase<Feature extends string = string> {
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

    // 不明な権限レベルが指定された場合は、安全のためfalseを返す
    if (userLevelIndex === -1 || requiredLevelIndex === -1) {
      return false;
    }

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

  /**
   * 入力の検証
   * 派生先で override し、Feature の検証も行ってください
   * @param feature 機能
   * @param level 権限レベル
   */
  public validate(feature: Feature, level: PermissionLevel): void {
    if (!level || !Object.values(PermissionLevel).includes(level as PermissionLevel)) {
      throw new BadRequestError('Invalid permission level');
    }
  }
}
