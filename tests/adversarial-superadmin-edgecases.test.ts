// tests/adversarial-superadmin-edgecases.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { preventLastSuperAdminDemotionOrDeactivation } from '../src/collections/Users';

describe('CHALLENGER: Adversarial Stress Test Suite for preventLastSuperAdminDemotionOrDeactivation', () => {

  const createMockReq = (totalDocs: number, docIds: (string | number)[] = ['admin-1']) => {
    let callCount = 0;
    let lastQuery: any = null;
    return {
      payload: {
        find: async (args: any) => {
          callCount++;
          lastQuery = args;
          return {
            docs: docIds.map((id) => ({ id, role: 'super-admin', isActive: true })),
            totalDocs,
          };
        },
      },
      getCallCount: () => callCount,
      getLastQuery: () => lastQuery,
    };
  };

  // =========================================================================
  // 1. Edge Case: undefined role on partial updates
  // =========================================================================
  describe('1. Partial Updates with Undefined Role', () => {
    it('allows partial update of name when role is undefined without DB query', async () => {
      const mockReq = createMockReq(1);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };
      const data = { name: 'Super Admin Updated' };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data,
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0, 'Must NOT query DB for name update');
      assert.strictEqual(result.name, 'Super Admin Updated');
    });

    it('allows explicit role: undefined in payload without DB query', async () => {
      const mockReq = createMockReq(1);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };
      const data = { role: undefined, phone: '+8801700000000' };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data,
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0, 'Must NOT query DB when role is explicitly undefined');
      assert.strictEqual(result.phone, '+8801700000000');
    });

    it('allows explicit role: "super-admin" reaffirmation without DB query', async () => {
      const mockReq = createMockReq(1);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };
      const data = { role: 'super-admin', name: 'Still Admin' };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data,
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0, 'Must NOT query DB when reaffirming super-admin role');
      assert.strictEqual(result.role, 'super-admin');
    });

    it('rejects deactivation when role is undefined but isActive is false', async () => {
      const mockReq = createMockReq(1, ['admin-1']);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };
      const data = { isActive: false }; // role is undefined

      await assert.rejects(
        async () => {
          await preventLastSuperAdminDemotionOrDeactivation({
            data,
            req: mockReq as any,
            operation: 'update',
            originalDoc,
          } as any);
        },
        (err: Error) => {
          assert.strictEqual(mockReq.getCallCount(), 1, 'Must query DB when isActive is false');
          assert.match(err.message, /Cannot deactivate the last remaining active Super Admin/i);
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 2. Edge Case: data.isActive === false
  // =========================================================================
  describe('2. data.isActive === false Scenarios', () => {
    it('blocks deactivating sole active super-admin when totalDocs is 1', async () => {
      const mockReq = createMockReq(1, ['admin-1']);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };

      await assert.rejects(
        async () => {
          await preventLastSuperAdminDemotionOrDeactivation({
            data: { isActive: false },
            req: mockReq as any,
            operation: 'update',
            originalDoc,
          } as any);
        },
        /Cannot deactivate the last remaining active Super Admin/i
      );
    });

    it('blocks deactivating sole active super-admin when totalDocs is 0 (anomalous state)', async () => {
      const mockReq = createMockReq(0, []);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };

      await assert.rejects(
        async () => {
          await preventLastSuperAdminDemotionOrDeactivation({
            data: { isActive: false },
            req: mockReq as any,
            operation: 'update',
            originalDoc,
          } as any);
        },
        /Cannot deactivate the last remaining active Super Admin/i
      );
    });

    it('permits deactivating super-admin when totalDocs is 2', async () => {
      const mockReq = createMockReq(2, ['admin-1', 'admin-2']);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data: { isActive: false },
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 1);
      assert.strictEqual(result.isActive, false);
    });

    it('permits updating already inactive super-admin with isActive: false without DB query', async () => {
      const mockReq = createMockReq(1, ['admin-1']);
      const originalDoc = { id: 'admin-2', role: 'super-admin', isActive: false };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data: { isActive: false },
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0, 'Must NOT query DB for already inactive user');
      assert.strictEqual(result.isActive, false);
    });

    it('permits setting isActive: true on active super-admin without DB query', async () => {
      const mockReq = createMockReq(1, ['admin-1']);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data: { isActive: true },
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0, 'Re-affirming isActive: true must NOT query DB');
      assert.strictEqual(result.isActive, true);
    });
  });

  // =========================================================================
  // 3. Edge Case: Simultaneous demotion and deactivation
  // =========================================================================
  describe('3. Simultaneous Demotion and Deactivation', () => {
    it('rejects simultaneous deactivation and demotion to assistant on sole super-admin', async () => {
      const mockReq = createMockReq(1, ['admin-1']);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };

      await assert.rejects(
        async () => {
          await preventLastSuperAdminDemotionOrDeactivation({
            data: { role: 'assistant', isActive: false },
            req: mockReq as any,
            operation: 'update',
            originalDoc,
          } as any);
        },
        (err: Error) => {
          assert.match(err.message, /Cannot deactivate or demote the last remaining active Super Admin/i);
          return true;
        }
      );
    });

    it('rejects simultaneous deactivation and demotion to doctor on sole super-admin', async () => {
      const mockReq = createMockReq(1, ['admin-1']);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };

      await assert.rejects(
        async () => {
          await preventLastSuperAdminDemotionOrDeactivation({
            data: { role: 'doctor', isActive: false },
            req: mockReq as any,
            operation: 'update',
            originalDoc,
          } as any);
        },
        /Cannot deactivate or demote the last remaining active Super Admin/i
      );
    });

    it('allows simultaneous deactivation and demotion when multiple super-admins exist', async () => {
      const mockReq = createMockReq(3, ['admin-1', 'admin-2', 'admin-3']);
      const originalDoc = { id: 'admin-1', role: 'super-admin', isActive: true };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data: { role: 'assistant', isActive: false },
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(result.role, 'assistant');
      assert.strictEqual(result.isActive, false);
      assert.strictEqual(mockReq.getCallCount(), 1);
    });
  });

  // =========================================================================
  // 4. Edge Case: Operations on Non-Super-Admin Users
  // =========================================================================
  describe('4. Operations on Non-Super-Admin Users', () => {
    it('allows deactivating an active doctor without querying DB', async () => {
      const mockReq = createMockReq(1);
      const originalDoc = { id: 'doc-1', role: 'doctor', isActive: true };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data: { isActive: false },
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0, 'Doctor deactivation must bypass DB lookup');
      assert.strictEqual(result.isActive, false);
    });

    it('allows demoting/changing role of an active assistant without querying DB', async () => {
      const mockReq = createMockReq(1);
      const originalDoc = { id: 'asst-1', role: 'assistant', isActive: true };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data: { role: 'doctor', isActive: false },
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0, 'Assistant role change must bypass DB lookup');
      assert.strictEqual(result.role, 'doctor');
      assert.strictEqual(result.isActive, false);
    });

    it('allows updating an inactive assistant or doctor without querying DB', async () => {
      const mockReq = createMockReq(1);
      const originalDoc = { id: 'asst-2', role: 'assistant', isActive: false };

      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data: { name: 'Reactivated Assistant', isActive: true },
        req: mockReq as any,
        operation: 'update',
        originalDoc,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0, 'Inactive user update must bypass DB lookup');
      assert.strictEqual(result.name, 'Reactivated Assistant');
    });
  });

  // =========================================================================
  // 5. Robustness & Boundary Conditions
  // =========================================================================
  describe('5. Robustness & Boundary Scenarios', () => {
    it('handles numeric vs string ID matching correctly', async () => {
      // payload doc has id 123 (number), originalDoc has id '123' (string)
      const mockReq = createMockReq(1, [123]);
      const originalDoc = { id: '123', role: 'super-admin', isActive: true };

      await assert.rejects(
        async () => {
          await preventLastSuperAdminDemotionOrDeactivation({
            data: { isActive: false },
            req: mockReq as any,
            operation: 'update',
            originalDoc,
          } as any);
        },
        /Cannot deactivate the last remaining active Super Admin/i
      );
    });

    it('bypasses when operation is create, regardless of data payload', async () => {
      const mockReq = createMockReq(0);
      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data: { role: 'assistant', isActive: false },
        req: mockReq as any,
        operation: 'create',
        originalDoc: undefined,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0);
      assert.strictEqual(result.role, 'assistant');
    });

    it('bypasses gracefully if originalDoc is undefined on update', async () => {
      const mockReq = createMockReq(1);
      const result = await preventLastSuperAdminDemotionOrDeactivation({
        data: { role: 'assistant', isActive: false },
        req: mockReq as any,
        operation: 'update',
        originalDoc: undefined,
      } as any);

      assert.strictEqual(mockReq.getCallCount(), 0);
    });
  });
});
