# 認可アーキテクチャ設計

## 概要

本ドキュメントは、TypeScript アプリケーションにおける汎用的な認可（Authorization）アーキテクチャの設計を定義します。このアーキテクチャは、機能（Feature）とアクセスレベル（Permission Level）を組み合わせた柔軟な認可システムを提供します。

**注意**: 本ドキュメントは汎用的な設計を記述しており、フレームワーク（Next.js等）固有の実装詳細は含みません。各プロジェクトでの具体的な実装については、派生プロジェクトのドキュメントを参照してください。

## 背景と課題

### 従来のロールベース認可の課題

従来のロールベースの認可システムには、以下のような課題があります：

1. **汎用性の欠如**: 機能ごとに異なる権限レベル（View、Edit、Delete など）を設定できない
2. **拡張性の低さ**: 新しいロールや権限を追加する際、多数のファイルを修正する必要がある
3. **一貫性の欠如**: API とクライアントで異なる認可ロジックが混在
4. **ゲストユーザー対応不足**: 未ログインユーザーに対する部分的な閲覧権限などが実装しにくい
5. **権限の粒度**: 機能全体ではなく、特定の操作（閲覧、編集、削除など）ごとに権限を設定したい

## 設計方針

### 基本コンセプト

1. **機能ベースの権限管理**: 各機能（Feature）に対して権限を定義
2. **レベル別のアクセス制御**: View、Edit、Delete など、操作レベルでの権限管理
3. **ユーザータイプの柔軟な定義**: ゲスト、ログインユーザー、管理者など
4. **宣言的な権限設定**: 設定データで権限マトリックスを定義
5. **統一的な認可チェック**: すべてのレイヤーで同じ認可ロジックを使用

### ユーザー識別の考え方

本設計では、ユーザーの識別に **AuthService が管理する UserID** を使用します。これは以下の理由によるものです：

- **抽象化**: 認証プロバイダー（Google、GitHub等）に依存しない設計
- **一貫性**: typescript-common の AuthService を通じて統一的にユーザーを管理
- **拡張性**: 将来的に複数の認証プロバイダーに対応可能

```typescript
// AuthService経由でUserIDを取得
const authService = new AuthService();
const userId = await authService.getUserIdFromSession();

// UserIDベースで認証データを取得
const authData = await authService.getById(userId);
```

GoogleUserID などのプロバイダー固有のIDは、AuthService の内部で管理され、直接使用しません。

## アーキテクチャ設計

### 1. 権限の構造

#### 1.1 機能（Feature）

アプリケーション内の各機能を表します。機能は各プロジェクトで定義されます。

```typescript
// 機能の定義例（プロジェクトごとに定義）
enum Feature {
  RESOURCE_A = 'resourceA',        // リソースA管理
  RESOURCE_B = 'resourceB',        // リソースB管理
  USER_SETTINGS = 'userSettings',  // ユーザー設定
  ADMIN_PANEL = 'adminPanel',      // 管理パネル
}
```

#### 1.2 権限レベル（Permission Level）

各機能に対する操作の種類を表します。これは汎用的な定義として提供されます。

```typescript
// 権限レベルの定義（汎用）
enum PermissionLevel {
  NONE = 'none',       // アクセス不可
  VIEW = 'view',       // 閲覧のみ
  EDIT = 'edit',       // 編集可能（閲覧も含む）
  DELETE = 'delete',   // 削除可能（編集・閲覧も含む）
  ADMIN = 'admin',     // 管理者権限（すべての操作が可能）
}
```

**権限の階層関係**:
```
NONE < VIEW < EDIT < DELETE < ADMIN
```

この階層により、上位の権限は下位の権限をすべて含むことが保証されます。

#### 1.3 ユーザータイプ（User Type）

システムを利用するユーザーのカテゴリを表します。

```typescript
// ユーザータイプの定義（汎用）
enum UserType {
  GUEST = 'guest',                 // 未ログインユーザー
  AUTHENTICATED = 'authenticated', // ログイン済みユーザー
  PREMIUM = 'premium',             // プレミアムユーザー（将来的な拡張用）
  ADMIN = 'admin',                 // 管理者
}
```

プロジェクトの要件に応じて、追加のユーザータイプを定義することができます。

### 2. 権限マトリックス

機能とユーザータイプの組み合わせで、各ユーザータイプが持つ権限レベルを定義します。

#### 2.1 権限マトリックスの型定義

```typescript
// 権限マトリックスの型定義（汎用）
type PermissionMatrix = {
  [feature in Feature]: {
    [userType in UserType]: PermissionLevel;
  };
};
```

#### 2.2 権限マトリックスの管理

権限マトリックスは、以下のいずれかの方法で管理できます：

**方法A: データベースで管理（推奨）**

動的に権限を変更できるよう、データベースに保存します。

```typescript
// 権限マトリックスレコードの型定義
interface PermissionMatrixRecord {
  Id: string;                    // 'PermissionMatrix'
  DataType: string;              // 'PermissionMatrix'
  Matrix: PermissionMatrix;      // 権限マトリックスデータ
  Create: number;
  Update: number;
}
```

**方法B: 設定ファイルで管理**

静的な権限設定の場合、設定ファイルで管理することもできます。

```typescript
// 設定ファイルの例
const defaultPermissionMatrix: PermissionMatrix = {
  [Feature.RESOURCE_A]: {
    [UserType.GUEST]: PermissionLevel.NONE,
    [UserType.AUTHENTICATED]: PermissionLevel.VIEW,
    [UserType.PREMIUM]: PermissionLevel.EDIT,
    [UserType.ADMIN]: PermissionLevel.ADMIN,
  },
  // 他の機能の設定...
};
```

### 3. 認可サービスの設計

#### 3.1 AuthorizationService の責務

汎用的な認可チェックを提供するサービスクラスです。

```typescript
/**
 * 汎用認可サービス
 * 機能とレベルに基づいた権限チェックを提供
 */
abstract class AuthorizationServiceBase {
  /**
   * ユーザーが指定された機能に対して指定レベルの権限を持つかチェック
   * 
   * @param userType ユーザータイプ
   * @param feature 機能
   * @param requiredLevel 必要な権限レベル
   * @returns 権限がある場合true
   */
  public async hasPermission(
    userType: UserType,
    feature: Feature,
    requiredLevel: PermissionLevel
  ): Promise<boolean> {
    // 権限マトリックスを取得
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
    const levelHierarchy = [
      PermissionLevel.NONE,
      PermissionLevel.VIEW,
      PermissionLevel.EDIT,
      PermissionLevel.DELETE,
      PermissionLevel.ADMIN,
    ];

    const userLevelIndex = levelHierarchy.indexOf(userLevel);
    const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);

    return userLevelIndex >= requiredLevelIndex;
  }

  /**
   * 権限マトリックスを取得（派生クラスで実装）
   */
  protected abstract getPermissionMatrix(): Promise<PermissionMatrix>;

  /**
   * ユーザータイプを取得（派生クラスで実装）
   */
  protected abstract getUserType(): Promise<UserType>;

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
    return this.hasPermission(userType, feature, requiredLevel);
  }
}
```

#### 3.2 プロジェクト固有の実装

各プロジェクトでは、`AuthorizationServiceBase` を継承して具体的な実装を提供します。

```typescript
// プロジェクト固有の実装例
class ProjectAuthorizationService extends AuthorizationServiceBase {
  protected async getPermissionMatrix(): Promise<PermissionMatrix> {
    // データベースから取得、または設定ファイルから読み込み
    return await PermissionMatrixService.getPermissionMatrix();
  }

  protected async getUserType(): Promise<UserType> {
    // セッションやトークンからユーザータイプを判定
    // 実装はプロジェクトごとに異なる
  }
}
```

### 4. カスタム権限のサポート

特定のユーザーに対して、権限マトリックスとは異なる権限を設定できる仕組みを提供します。

```typescript
/**
 * カスタム権限のチェック
 */
abstract class AuthorizationServiceBase {
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
   * ユーザー固有のカスタム権限を取得（派生クラスでオプション実装）
   */
  protected async getCustomPermission(
    userId: string,
    feature: Feature
  ): Promise<PermissionLevel | null> {
    // デフォルト実装：カスタム権限なし
    return null;
  }
}
```

## データモデル

### AuthRecordType の拡張

既存の `AuthRecordType` を拡張して権限情報を追加します。各プロジェクトで具体的な構造を定義します。

```typescript
// 基本的な AuthRecordType（typescript-common で定義）
interface AuthRecordType extends RecordTypeBase {
  DataType: 'Auth';
  Name: string;
  GoogleUserID: string;
}

// プロジェクト固有の拡張例
interface ProjectAuthRecordType extends AuthRecordType {
  ProjectSpecific?: {
    roles: string[];             // ロール情報
    userType?: UserType;         // ユーザータイプ
    customPermissions?: {        // カスタム権限（オプション）
      [feature: string]: PermissionLevel;
    };
  };
}
```

**設計のポイント**:
- `AuthRecordType` は typescript-common で定義される基底型
- プロジェクト固有の情報は専用フィールド内にカプセル化
- 他のモジュールへの影響を最小限に抑える

## パフォーマンス考慮事項

### 権限キャッシュ

頻繁な権限チェックによるパフォーマンス低下を防ぐため、権限情報をキャッシュします。

```typescript
import CacheUtil from '@common/utils/CacheUtil';

abstract class AuthorizationServiceBase {
  private static readonly CACHE_PREFIX = 'user_permissions_';
  private static readonly CACHE_TTL = 300; // 5分

  protected async getUserPermissions(userId: string): Promise<Map<Feature, PermissionLevel>> {
    const cacheKey = `${AuthorizationServiceBase.CACHE_PREFIX}${userId}`;
    
    // CacheUtil を使用してキャッシュチェック
    const cached = CacheUtil.get<Map<Feature, PermissionLevel>>(cacheKey);
    if (cached) {
      return cached;
    }

    // 権限を取得してキャッシュ
    const permissions = await this.loadUserPermissions(userId);
    CacheUtil.set(cacheKey, permissions, AuthorizationServiceBase.CACHE_TTL);

    return permissions;
  }

  protected clearCache(userId?: string): void {
    if (userId) {
      const cacheKey = `${AuthorizationServiceBase.CACHE_PREFIX}${userId}`;
      CacheUtil.delete(cacheKey);
    } else {
      // 全ユーザーのキャッシュをクリア
      CacheUtil.clear(AuthorizationServiceBase.CACHE_PREFIX);
    }
  }

  /**
   * ユーザーの権限を読み込む（派生クラスで実装）
   */
  protected abstract loadUserPermissions(userId: string): Promise<Map<Feature, PermissionLevel>>;
}
```

**キャッシュの利用ポイント**:
- typescript-common の `CacheUtil` を活用
- セッション期間中は権限情報をキャッシュ
- 権限変更時はキャッシュをクリア

## セキュリティ考慮事項

### 1. クライアントサイドの権限チェック

- クライアントサイドの権限チェックはUIの表示制御のみに使用
- 実際の認可は必ずサーバーサイドで実施
- クライアントサイドの権限情報を信頼しない

### 2. 権限の検証

- すべての重要な操作で認可チェックを実施
- ミドルウェアパターンを使用して認可チェックの漏れを防止
- デフォルトで拒否（Deny by Default）の原則を適用

### 3. 権限マトリックスの管理

- 権限マトリックスは適切なアクセス制御の下で管理
- 変更時はレビューを必須とする
- 定期的な権限の見直し

### 4. ログとモニタリング

- 認可の成功/失敗をログに記録
- 不正なアクセス試行を検知・警告
- 監査証跡の保持

## テスト戦略

### 単体テスト

```typescript
describe('AuthorizationServiceBase', () => {
  describe('comparePermissionLevel', () => {
    it('should return true when user level is higher than required level', () => {
      const service = new TestAuthorizationService();
      expect(service.comparePermissionLevel(
        PermissionLevel.ADMIN,
        PermissionLevel.VIEW
      )).toBe(true);
    });

    it('should return false when user level is lower than required level', () => {
      const service = new TestAuthorizationService();
      expect(service.comparePermissionLevel(
        PermissionLevel.VIEW,
        PermissionLevel.EDIT
      )).toBe(false);
    });

    it('should handle equal permission levels correctly', () => {
      const service = new TestAuthorizationService();
      expect(service.comparePermissionLevel(
        PermissionLevel.EDIT,
        PermissionLevel.EDIT
      )).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should grant admin full access to all features', async () => {
      const service = new TestAuthorizationService();
      const features = Object.values(Feature);
      
      for (const feature of features) {
        const result = await service.hasPermission(
          UserType.ADMIN,
          feature,
          PermissionLevel.ADMIN
        );
        expect(result).toBe(true);
      }
    });

    it('should deny guest access to restricted features', async () => {
      const service = new TestAuthorizationService();
      const result = await service.hasPermission(
        UserType.GUEST,
        Feature.ADMIN_PANEL,
        PermissionLevel.VIEW
      );
      expect(result).toBe(false);
    });
  });
});
```

### 統合テスト

- 実際のデータベースとの連携テスト
- 認証サービスとの統合テスト
- エンドツーエンドの権限チェックフロー

## 将来的な拡張

### 1. リソースレベルの認可

特定のリソースに対する権限管理：

```typescript
// 例：特定のリソースに対する権限チェック
await authService.authorizeResource(
  Feature.RESOURCE_A,
  PermissionLevel.EDIT,
  { resourceId: 'resource-123', userId: currentUserId }
);
```

### 2. 動的権限

時間や条件に基づく動的な権限管理：

```typescript
// 例：時間帯に基づく権限チェック
await authService.authorizeWithConditions(
  Feature.RESOURCE_B,
  PermissionLevel.VIEW,
  { 
    timeWindow: { start: '09:00', end: '17:00' },
    timezone: 'Asia/Tokyo'
  }
);
```

### 3. 権限委譲

一時的な権限の委譲：

```typescript
// 例：権限の委譲
await authService.delegatePermission(
  fromUserId,
  toUserId,
  Feature.RESOURCE_A,
  PermissionLevel.EDIT,
  { expiresAt: Date.now() + 86400000 } // 24時間
);
```

### 4. ロールベースとの併用

従来のロールベース認可との併用：

```typescript
// ロールからユーザータイプへのマッピング
const roleToUserType: Map<string, UserType> = new Map([
  ['ROLE_ADMIN', UserType.ADMIN],
  ['ROLE_USER', UserType.AUTHENTICATED],
  ['ROLE_GUEST', UserType.GUEST],
]);
```

## まとめ

### 本アーキテクチャの利点

1. **柔軟性**: 機能とレベルを組み合わせた細かい権限制御
2. **拡張性**: 新しい機能や権限レベルを容易に追加可能
3. **一貫性**: すべてのレイヤーで統一された認可ロジック
4. **保守性**: 権限マトリックスによる一元管理
5. **テスタビリティ**: 明確な責務分離によるテスト容易性
6. **型安全性**: TypeScript による型チェック
7. **汎用性**: フレームワークに依存しない設計

### 実装時の注意点

1. **権限マトリックスの設計**: プロジェクトの要件に合わせて適切に設計
2. **パフォーマンス**: キャッシュを適切に活用
3. **セキュリティ**: サーバーサイドでの認可チェックを徹底
4. **テスト**: 単体テストと統合テストを組み合わせる
5. **ドキュメント**: 権限設計の変更を適切にドキュメント化

### プロジェクトでの実装

各プロジェクトでは、以下を実装する必要があります：

1. **Feature の定義**: プロジェクト固有の機能を列挙
2. **AuthorizationService の実装**: `AuthorizationServiceBase` を継承
3. **権限マトリックスの管理**: データベースまたは設定ファイル
4. **認可チェックの統合**: API やビジネスロジックに認可チェックを追加
5. **UI コンポーネント**: 権限に基づく表示制御（フレームワーク固有）

本アーキテクチャは、現在のシステムを段階的に改善しながら、将来的な拡張にも対応できる柔軟な設計となっています。

## 参考資料

- [CRUDServiceBase ドキュメント](./CRUDServiceBase.md)
- [OpenAIService ドキュメント](./OpenAIService.md)
- 既存の AuthService 実装 (`common/services/auth/`)
- 既存の AuthorizeUtil 実装 (`common/utils/AuthorizeUtil.ts`)
