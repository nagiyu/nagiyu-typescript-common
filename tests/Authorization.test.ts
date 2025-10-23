import { AuthorizationServiceBase } from '@common/services/authorization/AuthorizationServiceBase';
import { PermissionLevel } from '@common/enums/PermissionLevel';
import { UserType } from '@common/enums/UserType';
import { PermissionMatrix } from '@common/interfaces/authorization/PermissionMatrix';
import CacheUtil from '@common/utils/CacheUtil';

// テスト用の機能定義
enum TestFeature {
  RESOURCE_A = 'resourceA',
  RESOURCE_B = 'resourceB',
  USER_SETTINGS = 'userSettings',
  ADMIN_PANEL = 'adminPanel',
}

// テスト用の権限マトリックス
const testPermissionMatrix: PermissionMatrix<TestFeature> = {
  [TestFeature.RESOURCE_A]: {
    [UserType.GUEST]: PermissionLevel.NONE,
    [UserType.AUTHENTICATED]: PermissionLevel.VIEW,
    [UserType.PREMIUM]: PermissionLevel.EDIT,
    [UserType.ADMIN]: PermissionLevel.ADMIN,
  },
  [TestFeature.RESOURCE_B]: {
    [UserType.GUEST]: PermissionLevel.VIEW,
    [UserType.AUTHENTICATED]: PermissionLevel.EDIT,
    [UserType.PREMIUM]: PermissionLevel.DELETE,
    [UserType.ADMIN]: PermissionLevel.ADMIN,
  },
  [TestFeature.USER_SETTINGS]: {
    [UserType.GUEST]: PermissionLevel.NONE,
    [UserType.AUTHENTICATED]: PermissionLevel.EDIT,
    [UserType.PREMIUM]: PermissionLevel.EDIT,
    [UserType.ADMIN]: PermissionLevel.ADMIN,
  },
  [TestFeature.ADMIN_PANEL]: {
    [UserType.GUEST]: PermissionLevel.NONE,
    [UserType.AUTHENTICATED]: PermissionLevel.NONE,
    [UserType.PREMIUM]: PermissionLevel.NONE,
    [UserType.ADMIN]: PermissionLevel.ADMIN,
  },
};

// テスト用の認可サービス実装
class TestAuthorizationService extends AuthorizationServiceBase<TestFeature> {
  private currentUserType: UserType = UserType.GUEST;
  private currentUserId?: string;
  private customPermissions: Map<string, Map<TestFeature, PermissionLevel>> = new Map();

  protected async getPermissionMatrix(): Promise<PermissionMatrix<TestFeature>> {
    return testPermissionMatrix;
  }

  protected async getUserType(): Promise<UserType> {
    return this.currentUserType;
  }

  protected async getUserId(): Promise<string | undefined> {
    return this.currentUserId;
  }

  protected async loadUserPermissions(userId: string): Promise<Map<TestFeature, PermissionLevel>> {
    const permissions = new Map<TestFeature, PermissionLevel>();
    const userType = await this.getUserType();
    
    Object.values(TestFeature).forEach(feature => {
      permissions.set(feature, testPermissionMatrix[feature][userType]);
    });

    return permissions;
  }

  protected async getCustomPermission(
    userId: string,
    feature: TestFeature
  ): Promise<PermissionLevel | null> {
    const userPermissions = this.customPermissions.get(userId);
    if (userPermissions) {
      return userPermissions.get(feature) || null;
    }
    return null;
  }

  // テスト用のヘルパーメソッド
  public setUserType(userType: UserType): void {
    this.currentUserType = userType;
  }

  public setUserId(userId: string | undefined): void {
    this.currentUserId = userId;
  }

  public setCustomPermission(userId: string, feature: TestFeature, level: PermissionLevel): void {
    if (!this.customPermissions.has(userId)) {
      this.customPermissions.set(userId, new Map());
    }
    this.customPermissions.get(userId)!.set(feature, level);
  }

  public clearCustomPermissions(): void {
    this.customPermissions.clear();
  }

  public testClearCache(userId?: string): void {
    this.clearCache(userId);
  }

  public async testGetUserPermissions(userId: string): Promise<Map<TestFeature, PermissionLevel>> {
    return this.getUserPermissions(userId);
  }

  public testComparePermissionLevel(userLevel: PermissionLevel, requiredLevel: PermissionLevel): boolean {
    return this.comparePermissionLevel(userLevel, requiredLevel);
  }
}

describe('AuthorizationServiceBase', () => {
  let service: TestAuthorizationService;

  beforeEach(() => {
    service = new TestAuthorizationService();
    service.clearCustomPermissions();
    // キャッシュをクリア
    CacheUtil.clearByPrefix('user_permissions_');
  });

  describe('comparePermissionLevel', () => {
    it('should return true when user level is higher than required level', () => {
      expect(service.testComparePermissionLevel(PermissionLevel.ADMIN, PermissionLevel.VIEW)).toBe(true);
      expect(service.testComparePermissionLevel(PermissionLevel.DELETE, PermissionLevel.EDIT)).toBe(true);
      expect(service.testComparePermissionLevel(PermissionLevel.EDIT, PermissionLevel.VIEW)).toBe(true);
    });

    it('should return false when user level is lower than required level', () => {
      expect(service.testComparePermissionLevel(PermissionLevel.VIEW, PermissionLevel.EDIT)).toBe(false);
      expect(service.testComparePermissionLevel(PermissionLevel.EDIT, PermissionLevel.DELETE)).toBe(false);
      expect(service.testComparePermissionLevel(PermissionLevel.NONE, PermissionLevel.VIEW)).toBe(false);
    });

    it('should return true when user level equals required level', () => {
      expect(service.testComparePermissionLevel(PermissionLevel.VIEW, PermissionLevel.VIEW)).toBe(true);
      expect(service.testComparePermissionLevel(PermissionLevel.EDIT, PermissionLevel.EDIT)).toBe(true);
      expect(service.testComparePermissionLevel(PermissionLevel.DELETE, PermissionLevel.DELETE)).toBe(true);
      expect(service.testComparePermissionLevel(PermissionLevel.ADMIN, PermissionLevel.ADMIN)).toBe(true);
    });

    it('should handle NONE permission level correctly', () => {
      expect(service.testComparePermissionLevel(PermissionLevel.NONE, PermissionLevel.NONE)).toBe(true);
      expect(service.testComparePermissionLevel(PermissionLevel.NONE, PermissionLevel.VIEW)).toBe(false);
    });
  });

  describe('hasPermission', () => {
    describe('Admin user permissions', () => {
      it('should grant admin full access to all features', async () => {
        const features = Object.values(TestFeature);
        
        for (const feature of features) {
          const result = await service.hasPermission(
            UserType.ADMIN,
            feature,
            PermissionLevel.ADMIN
          );
          expect(result).toBe(true);
        }
      });

      it('should grant admin access to all permission levels', async () => {
        const levels = [
          PermissionLevel.VIEW,
          PermissionLevel.EDIT,
          PermissionLevel.DELETE,
          PermissionLevel.ADMIN
        ];

        for (const level of levels) {
          const result = await service.hasPermission(
            UserType.ADMIN,
            TestFeature.RESOURCE_A,
            level
          );
          expect(result).toBe(true);
        }
      });
    });

    describe('Guest user permissions', () => {
      it('should deny guest access to restricted features', async () => {
        const result = await service.hasPermission(
          UserType.GUEST,
          TestFeature.ADMIN_PANEL,
          PermissionLevel.VIEW
        );
        expect(result).toBe(false);
      });

      it('should allow guest to view resource B', async () => {
        const result = await service.hasPermission(
          UserType.GUEST,
          TestFeature.RESOURCE_B,
          PermissionLevel.VIEW
        );
        expect(result).toBe(true);
      });

      it('should deny guest edit access to resource B', async () => {
        const result = await service.hasPermission(
          UserType.GUEST,
          TestFeature.RESOURCE_B,
          PermissionLevel.EDIT
        );
        expect(result).toBe(false);
      });

      it('should deny guest access to resource A', async () => {
        const result = await service.hasPermission(
          UserType.GUEST,
          TestFeature.RESOURCE_A,
          PermissionLevel.VIEW
        );
        expect(result).toBe(false);
      });
    });

    describe('Authenticated user permissions', () => {
      it('should allow authenticated user to view resource A', async () => {
        const result = await service.hasPermission(
          UserType.AUTHENTICATED,
          TestFeature.RESOURCE_A,
          PermissionLevel.VIEW
        );
        expect(result).toBe(true);
      });

      it('should deny authenticated user to edit resource A', async () => {
        const result = await service.hasPermission(
          UserType.AUTHENTICATED,
          TestFeature.RESOURCE_A,
          PermissionLevel.EDIT
        );
        expect(result).toBe(false);
      });

      it('should allow authenticated user to edit resource B', async () => {
        const result = await service.hasPermission(
          UserType.AUTHENTICATED,
          TestFeature.RESOURCE_B,
          PermissionLevel.EDIT
        );
        expect(result).toBe(true);
      });

      it('should allow authenticated user to edit user settings', async () => {
        const result = await service.hasPermission(
          UserType.AUTHENTICATED,
          TestFeature.USER_SETTINGS,
          PermissionLevel.EDIT
        );
        expect(result).toBe(true);
      });

      it('should deny authenticated user access to admin panel', async () => {
        const result = await service.hasPermission(
          UserType.AUTHENTICATED,
          TestFeature.ADMIN_PANEL,
          PermissionLevel.VIEW
        );
        expect(result).toBe(false);
      });
    });

    describe('Premium user permissions', () => {
      it('should allow premium user to edit resource A', async () => {
        const result = await service.hasPermission(
          UserType.PREMIUM,
          TestFeature.RESOURCE_A,
          PermissionLevel.EDIT
        );
        expect(result).toBe(true);
      });

      it('should allow premium user to delete resource B', async () => {
        const result = await service.hasPermission(
          UserType.PREMIUM,
          TestFeature.RESOURCE_B,
          PermissionLevel.DELETE
        );
        expect(result).toBe(true);
      });

      it('should deny premium user admin access to resource A', async () => {
        const result = await service.hasPermission(
          UserType.PREMIUM,
          TestFeature.RESOURCE_A,
          PermissionLevel.ADMIN
        );
        expect(result).toBe(false);
      });
    });

    describe('Custom permissions', () => {
      it('should override matrix permissions with custom permissions', async () => {
        const userId = 'user123';
        service.setCustomPermission(userId, TestFeature.RESOURCE_A, PermissionLevel.ADMIN);

        const result = await service.hasPermission(
          UserType.GUEST,
          TestFeature.RESOURCE_A,
          PermissionLevel.ADMIN,
          userId
        );
        expect(result).toBe(true);
      });

      it('should fall back to matrix permissions when custom permission is not set', async () => {
        const userId = 'user123';

        const result = await service.hasPermission(
          UserType.AUTHENTICATED,
          TestFeature.RESOURCE_A,
          PermissionLevel.VIEW,
          userId
        );
        expect(result).toBe(true);
      });

      it('should use custom permission when it is more restrictive', async () => {
        const userId = 'user123';
        service.setCustomPermission(userId, TestFeature.RESOURCE_A, PermissionLevel.NONE);

        const result = await service.hasPermission(
          UserType.ADMIN,
          TestFeature.RESOURCE_A,
          PermissionLevel.VIEW,
          userId
        );
        expect(result).toBe(false);
      });
    });

    describe('Permission hierarchy', () => {
      it('should respect permission hierarchy for VIEW', async () => {
        expect(await service.hasPermission(UserType.PREMIUM, TestFeature.RESOURCE_A, PermissionLevel.VIEW)).toBe(true);
        expect(await service.hasPermission(UserType.AUTHENTICATED, TestFeature.RESOURCE_A, PermissionLevel.VIEW)).toBe(true);
      });

      it('should respect permission hierarchy for EDIT', async () => {
        expect(await service.hasPermission(UserType.PREMIUM, TestFeature.RESOURCE_B, PermissionLevel.EDIT)).toBe(true);
        expect(await service.hasPermission(UserType.AUTHENTICATED, TestFeature.RESOURCE_B, PermissionLevel.EDIT)).toBe(true);
      });

      it('should respect permission hierarchy for DELETE', async () => {
        expect(await service.hasPermission(UserType.PREMIUM, TestFeature.RESOURCE_B, PermissionLevel.DELETE)).toBe(true);
        expect(await service.hasPermission(UserType.AUTHENTICATED, TestFeature.RESOURCE_B, PermissionLevel.DELETE)).toBe(false);
      });
    });
  });

  describe('authorize', () => {
    it('should authorize based on current user type', async () => {
      service.setUserType(UserType.ADMIN);
      
      const result = await service.authorize(
        TestFeature.ADMIN_PANEL,
        PermissionLevel.ADMIN
      );
      expect(result).toBe(true);
    });

    it('should deny authorization for insufficient permissions', async () => {
      service.setUserType(UserType.GUEST);
      
      const result = await service.authorize(
        TestFeature.ADMIN_PANEL,
        PermissionLevel.VIEW
      );
      expect(result).toBe(false);
    });

    it('should use custom permissions when userId is set', async () => {
      const userId = 'user123';
      service.setUserType(UserType.GUEST);
      service.setUserId(userId);
      service.setCustomPermission(userId, TestFeature.ADMIN_PANEL, PermissionLevel.ADMIN);

      const result = await service.authorize(
        TestFeature.ADMIN_PANEL,
        PermissionLevel.ADMIN
      );
      expect(result).toBe(true);
    });
  });

  describe('Cache functionality', () => {
    it('should cache user permissions', async () => {
      const userId = 'user123';
      service.setUserType(UserType.AUTHENTICATED);

      // 初回呼び出し
      const permissions1 = await service.testGetUserPermissions(userId);
      
      // キャッシュから取得
      const permissions2 = await service.testGetUserPermissions(userId);

      expect(permissions1).toEqual(permissions2);
    });

    it('should clear cache for specific user', async () => {
      const userId = 'user123';
      service.setUserType(UserType.AUTHENTICATED);

      await service.testGetUserPermissions(userId);
      
      service.testClearCache(userId);

      const cached = CacheUtil.get(`user_permissions_${userId}`);
      expect(cached).toBeNull();
    });

    it('should clear cache for all users', async () => {
      service.setUserType(UserType.AUTHENTICATED);
      
      await service.testGetUserPermissions('user1');
      await service.testGetUserPermissions('user2');
      await service.testGetUserPermissions('user3');

      service.testClearCache();

      expect(CacheUtil.get('user_permissions_user1')).toBeNull();
      expect(CacheUtil.get('user_permissions_user2')).toBeNull();
      expect(CacheUtil.get('user_permissions_user3')).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined feature in permission matrix', async () => {
      const result = await service.hasPermission(
        UserType.AUTHENTICATED,
        'nonExistentFeature' as TestFeature,
        PermissionLevel.VIEW
      );
      expect(result).toBe(false);
    });

    it('should handle NONE permission level correctly', async () => {
      const result = await service.hasPermission(
        UserType.GUEST,
        TestFeature.RESOURCE_A,
        PermissionLevel.NONE
      );
      expect(result).toBe(true);
    });

    it('should return false for invalid permission levels', () => {
      const invalidLevel = 'invalid_level' as PermissionLevel;
      expect(service.testComparePermissionLevel(PermissionLevel.ADMIN, invalidLevel)).toBe(false);
      expect(service.testComparePermissionLevel(invalidLevel, PermissionLevel.VIEW)).toBe(false);
    });
  });
});
