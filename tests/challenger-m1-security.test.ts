import { test, describe, it } from 'node:test';
import assert from 'node:assert';

import {
  isAuthenticated,
  hasRole,
  isSuperAdmin,
  isSuperAdminOrDoctor,
  isSelfOrSuperAdmin,
  canReadUsers,
  isSuperAdminField,
} from '../src/lib/auth';

import { Users } from '../src/collections/Users';
import { AuditLogs } from '../src/collections/AuditLogs';
import { DoctorProfile } from '../src/globals/DoctorProfile';
import { SiteSettings } from '../src/globals/SiteSettings';
import { Media } from '../src/collections/Media';
import { up, down } from '../src/migrations/20261018_000001_initial';

describe('CHALLENGER M1.2: Adversarial Security & Concurrency DDL Stress Suite', () => {

  // =========================================================================
  // SECTION 1: Unauthenticated Access Stress Testing
  // =========================================================================
  describe('1. Unauthenticated Access Attacks', () => {
    const unauthenticatedRequests = [
      { req: { user: null } },
      { req: { user: undefined } },
      { req: {} },
      { req: { user: { id: 1, role: 'anonymous', isActive: false } } },
      { req: { user: { id: 999, role: 'guest' } } },
    ];

    it('rejects unauthenticated requests in isAuthenticated', () => {
      for (const reqObj of unauthenticatedRequests) {
        const result = isAuthenticated(reqObj as any);
        assert.strictEqual(result, false, `Expected false for ${JSON.stringify(reqObj)}`);
      }
    });

    it('rejects unauthenticated access to Admin Dashboard (Users.access.admin)', () => {
      const adminAccess = Users.access?.admin;
      assert.ok(adminAccess, 'Users.access.admin must be defined');

      for (const reqObj of unauthenticatedRequests) {
        const result = (adminAccess as any)(reqObj);
        assert.strictEqual(result, false, `Unauthenticated user should not access admin: ${JSON.stringify(reqObj)}`);
      }
    });

    it('rejects unauthenticated attempts to read, create, update, or delete Users', () => {
      const readAccess = Users.access?.read;
      const createAccess = Users.access?.create;
      const updateAccess = Users.access?.update;
      const deleteAccess = Users.access?.delete;

      for (const reqObj of unauthenticatedRequests) {
        assert.strictEqual((readAccess as any)(reqObj), false, 'Unauthenticated user cannot read users');
        assert.strictEqual((createAccess as any)(reqObj), false, 'Unauthenticated user cannot create users');
        assert.strictEqual((updateAccess as any)(reqObj), false, 'Unauthenticated user cannot update users');
        assert.strictEqual((deleteAccess as any)(reqObj), false, 'Unauthenticated user cannot delete users');
      }
    });

    it('rejects unauthenticated attempts to modify DoctorProfile or SiteSettings', () => {
      const updateDoctor = DoctorProfile.access?.update;
      const updateSettings = SiteSettings.access?.update;

      for (const reqObj of unauthenticatedRequests) {
        assert.strictEqual((updateDoctor as any)(reqObj), false, 'Unauthenticated user cannot update DoctorProfile');
        assert.strictEqual((updateSettings as any)(reqObj), false, 'Unauthenticated user cannot update SiteSettings');
      }
    });

    it('rejects unauthenticated attempts to read, create, update, or delete AuditLogs', () => {
      for (const reqObj of unauthenticatedRequests) {
        assert.strictEqual((AuditLogs.access?.read as any)(reqObj), false, 'Unauthenticated user cannot read AuditLogs');
        assert.strictEqual((AuditLogs.access?.create as any)(reqObj), false, 'Unauthenticated user cannot create AuditLogs');
        assert.strictEqual((AuditLogs.access?.update as any)(reqObj), false, 'Unauthenticated user cannot update AuditLogs');
        assert.strictEqual((AuditLogs.access?.delete as any)(reqObj), false, 'Unauthenticated user cannot delete AuditLogs');
      }
    });
  });

  // =========================================================================
  // SECTION 2: Assistant Role Privilege Escalation & Boundary Attacks
  // =========================================================================
  describe('2. Assistant Privilege Escalation & Boundary Attacks', () => {
    const activeAssistant = {
      id: 'asst-101',
      role: 'assistant',
      isActive: true,
      name: 'Clinic Assistant Staff',
    };

    const inactiveAssistant = {
      id: 'asst-102',
      role: 'assistant',
      isActive: false,
      name: 'Deactivated Assistant',
    };

    const activeDoctor = {
      id: 'doc-201',
      role: 'doctor',
      isActive: true,
      name: 'Dr. Specialized Physician',
    };

    const activeSuperAdmin = {
      id: 'admin-001',
      role: 'super-admin',
      isActive: true,
      name: 'Chief Super Admin',
    };

    it('prevents assistant from modifying DoctorProfile credentials', () => {
      const updateDoctor = DoctorProfile.access?.update;
      const result = (updateDoctor as any)({ req: { user: activeAssistant } });
      assert.strictEqual(result, false, 'Assistant MUST NOT have access to update DoctorProfile');
    });

    it('prevents assistant from modifying SiteSettings', () => {
      const updateSettings = SiteSettings.access?.update;
      const result = (updateSettings as any)({ req: { user: activeAssistant } });
      assert.strictEqual(result, false, 'Assistant MUST NOT have access to update SiteSettings');
    });

    it('prevents assistant from creating or deleting users', () => {
      const createUsers = Users.access?.create;
      const deleteUsers = Users.access?.delete;

      assert.strictEqual((createUsers as any)({ req: { user: activeAssistant } }), false, 'Assistant cannot create users');
      assert.strictEqual((deleteUsers as any)({ req: { user: activeAssistant } }), false, 'Assistant cannot delete users');
    });

    it('strictly confines assistant user update scope to their own ID', () => {
      const updateUsers = Users.access?.update;
      const query = (updateUsers as any)({ req: { user: activeAssistant } });

      assert.deepStrictEqual(query, { id: { equals: 'asst-101' } }, 'Assistant update query must filter strictly to self');

      // Verify that query does not match doctor or superadmin
      assert.notStrictEqual(query.id.equals, activeDoctor.id);
      assert.notStrictEqual(query.id.equals, activeSuperAdmin.id);
    });

    it('prevents assistant from escalating their own role or isActive via field-level access', () => {
      const roleField = Users.fields.find((f: any) => f.name === 'role');
      assert.ok(roleField, 'role field must exist');
      const roleUpdateAccess = (roleField as any).access?.update;
      assert.ok(roleUpdateAccess, 'role field must have update access guard');

      const roleEscalationResult = roleUpdateAccess({ req: { user: activeAssistant } });
      assert.strictEqual(roleEscalationResult, false, 'Assistant MUST NOT be allowed to update their own role');

      const isActiveField = Users.fields.find((f: any) => f.name === 'isActive');
      assert.ok(isActiveField, 'isActive field must exist');
      const isActiveUpdateAccess = (isActiveField as any).access?.update;
      assert.ok(isActiveUpdateAccess, 'isActive field must have update access guard');

      const activeToggleResult = isActiveUpdateAccess({ req: { user: activeAssistant } });
      assert.strictEqual(activeToggleResult, false, 'Assistant MUST NOT be allowed to update isActive');

      const notesField = Users.fields.find((f: any) => f.name === 'notes');
      assert.ok(notesField, 'notes field must exist');
      const notesReadAccess = (notesField as any).access?.read;
      const notesUpdateAccess = (notesField as any).access?.update;

      assert.strictEqual(notesReadAccess({ req: { user: activeAssistant } }), false, 'Assistant cannot read notes');
      assert.strictEqual(notesUpdateAccess({ req: { user: activeAssistant } }), false, 'Assistant cannot update notes');
    });

    it('prevents assistant from reading other users (can only read self)', () => {
      const readUsers = Users.access?.read;
      const query = (readUsers as any)({ req: { user: activeAssistant } });

      assert.deepStrictEqual(query, { id: { equals: 'asst-101' } }, 'Assistant read query must filter strictly to self');
      assert.notStrictEqual(query.id.equals, activeDoctor.id);
      assert.notStrictEqual(query.id.equals, activeSuperAdmin.id);
    });

    it('prevents assistant from reading, creating, updating, or deleting AuditLogs', () => {
      assert.strictEqual((AuditLogs.access?.read as any)({ req: { user: activeAssistant } }), false, 'Assistant cannot read AuditLogs');
      assert.strictEqual((AuditLogs.access?.create as any)({ req: { user: activeAssistant } }), false, 'Assistant cannot create AuditLogs');
      assert.strictEqual((AuditLogs.access?.update as any)({ req: { user: activeAssistant } }), false, 'Assistant cannot update AuditLogs');
      assert.strictEqual((AuditLogs.access?.delete as any)({ req: { user: activeAssistant } }), false, 'Assistant cannot delete AuditLogs');
    });

    it('denies all actions if assistant account is deactivated (isActive = false)', () => {
      assert.strictEqual(isAuthenticated({ req: { user: inactiveAssistant } } as any), false);
      assert.strictEqual((Users.access?.admin as any)({ req: { user: inactiveAssistant } }), false);
      assert.strictEqual((Users.access?.read as any)({ req: { user: inactiveAssistant } }), false);
      assert.strictEqual((Users.access?.update as any)({ req: { user: inactiveAssistant } }), false);
    });
  });

  // =========================================================================
  // SECTION 3: Doctor Role Boundaries
  // =========================================================================
  describe('3. Doctor Role RBAC Verification', () => {
    const activeDoctor = {
      id: 'doc-201',
      role: 'doctor',
      isActive: true,
      name: 'Dr. Specialized Physician',
    };

    it('allows doctor to update DoctorProfile and SiteSettings', () => {
      assert.strictEqual((DoctorProfile.access?.update as any)({ req: { user: activeDoctor } }), true);
      assert.strictEqual((SiteSettings.access?.update as any)({ req: { user: activeDoctor } }), true);
    });

    it('prevents doctor from creating or deleting users', () => {
      assert.strictEqual((Users.access?.create as any)({ req: { user: activeDoctor } }), false);
      assert.strictEqual((Users.access?.delete as any)({ req: { user: activeDoctor } }), false);
    });

    it('allows doctor to read self and assistants, but NOT super-admin', () => {
      const readQuery = (Users.access?.read as any)({ req: { user: activeDoctor } });
      assert.ok(readQuery.or, 'Doctor read query should have OR condition');
      assert.deepStrictEqual(readQuery.or, [
        { id: { equals: 'doc-201' } },
        { role: { equals: 'assistant' } },
      ]);
    });

    it('allows doctor to read AuditLogs but strictly forbids updating or deleting AuditLogs', () => {
      assert.strictEqual((AuditLogs.access?.read as any)({ req: { user: activeDoctor } }), true);
      assert.strictEqual((AuditLogs.access?.create as any)({ req: { user: activeDoctor } }), false);
      assert.strictEqual((AuditLogs.access?.update as any)({ req: { user: activeDoctor } }), false);
      assert.strictEqual((AuditLogs.access?.delete as any)({ req: { user: activeDoctor } }), false);
    });
  });

  // =========================================================================
  // SECTION 4: Last Active Super-Admin Deletion Guard
  // =========================================================================
  describe('4. Last Active Super-Admin Deletion Guard (beforeDelete hook)', () => {
    const beforeDeleteHooks = Users.hooks?.beforeDelete;
    assert.ok(beforeDeleteHooks && beforeDeleteHooks.length > 0, 'Users.hooks.beforeDelete must be configured');
    const guardHook = beforeDeleteHooks[0];

    it('REJECTS deletion when there is only 1 active super-admin in the system', async () => {
      const singleSuperAdminReq = {
        payload: {
          find: async (args: any) => {
            // Verify find parameters
            assert.strictEqual(args.collection, 'users');
            assert.deepStrictEqual(args.where, {
              and: [
                { role: { equals: 'super-admin' } },
                { isActive: { equals: true } },
              ],
            });
            return {
              docs: [{ id: 'admin-001', role: 'super-admin', isActive: true }],
              totalDocs: 1,
            };
          },
        },
      };

      await assert.rejects(
        async () => {
          await guardHook({ req: singleSuperAdminReq, id: 'admin-001' } as any);
        },
        (err: Error) => {
          assert.match(err.message, /Cannot delete the last remaining active Super Admin/i);
          return true;
        },
        'Must throw error when attempting to delete sole active super-admin'
      );
    });

    it('ALLOWS deletion of a super-admin when multiple active super-admins exist', async () => {
      const multiSuperAdminReq = {
        payload: {
          find: async () => ({
            docs: [
              { id: 'admin-001', role: 'super-admin', isActive: true },
              { id: 'admin-002', role: 'super-admin', isActive: true },
            ],
            totalDocs: 2,
          }),
        },
      };

      // Deleting admin-001 when admin-002 exists should NOT throw
      await assert.doesNotReject(async () => {
        await guardHook({ req: multiSuperAdminReq, id: 'admin-001' } as any);
      });
    });

    it('REJECTS deletion of the only active super-admin even if inactive super-admins exist', async () => {
      const mixedSuperAdminReq = {
        payload: {
          find: async (args: any) => {
            // Only active super-admins are queried by the where clause
            return {
              docs: [{ id: 'admin-001', role: 'super-admin', isActive: true }],
              totalDocs: 1,
            };
          },
        },
      };

      await assert.rejects(
        async () => {
          await guardHook({ req: mixedSuperAdminReq, id: 'admin-001' } as any);
        },
        /Cannot delete the last remaining active Super Admin/i
      );
    });

    it('ALLOWS deletion of doctors or assistants without triggering the super-admin guard', async () => {
      const singleSuperAdminReq = {
        payload: {
          find: async () => ({
            docs: [{ id: 'admin-001', role: 'super-admin', isActive: true }],
            totalDocs: 1,
          }),
        },
      };

      // Deleting a doctor or assistant should NOT trigger the last super admin error
      await assert.doesNotReject(async () => {
        await guardHook({ req: singleSuperAdminReq, id: 'doctor-999' } as any);
      });

      await assert.doesNotReject(async () => {
        await guardHook({ req: singleSuperAdminReq, id: 'assistant-888' } as any);
      });
    });
  });

  // =========================================================================
  // SECTION 4.1: Last Active Super-Admin Deactivation & Demotion Guard (beforeChange hook)
  // =========================================================================
  describe('4.1 Last Active Super-Admin Deactivation & Demotion Guard (beforeChange hook)', () => {
    const beforeChangeHooks = Users.hooks?.beforeChange;
    assert.ok(beforeChangeHooks && beforeChangeHooks.length > 0, 'Users.hooks.beforeChange must be configured');
    const changeGuardHook = beforeChangeHooks[0];

    const singleAdminReq = {
      payload: {
        find: async (args: any) => {
          assert.strictEqual(args.collection, 'users');
          assert.deepStrictEqual(args.where, {
            and: [
              { role: { equals: 'super-admin' } },
              { isActive: { equals: true } },
            ],
          });
          return {
            docs: [{ id: 'admin-001', role: 'super-admin', isActive: true }],
            totalDocs: 1,
          };
        },
      },
    };

    const multiAdminReq = {
      payload: {
        find: async () => ({
          docs: [
            { id: 'admin-001', role: 'super-admin', isActive: true },
            { id: 'admin-002', role: 'super-admin', isActive: true },
          ],
          totalDocs: 2,
        }),
      },
    };

    it('REJECTS deactivating sole active super-admin (isActive: false)', async () => {
      await assert.rejects(
        async () => {
          await changeGuardHook({
            data: { isActive: false },
            req: singleAdminReq,
            operation: 'update',
            originalDoc: { id: 'admin-001', role: 'super-admin', isActive: true },
          } as any);
        },
        (err: Error) => {
          assert.match(err.message, /Cannot deactivate the last remaining active Super Admin/i);
          return true;
        }
      );
    });

    it('REJECTS demoting sole active super-admin to assistant (role: assistant)', async () => {
      await assert.rejects(
        async () => {
          await changeGuardHook({
            data: { role: 'assistant' },
            req: singleAdminReq,
            operation: 'update',
            originalDoc: { id: 'admin-001', role: 'super-admin', isActive: true },
          } as any);
        },
        (err: Error) => {
          assert.match(err.message, /Cannot demote the last remaining active Super Admin/i);
          return true;
        }
      );
    });

    it('REJECTS demoting sole active super-admin to doctor (role: doctor)', async () => {
      await assert.rejects(
        async () => {
          await changeGuardHook({
            data: { role: 'doctor' },
            req: singleAdminReq,
            operation: 'update',
            originalDoc: { id: 'admin-001', role: 'super-admin', isActive: true },
          } as any);
        },
        /Cannot demote the last remaining active Super Admin/i
      );
    });

    it('REJECTS simultaneous deactivation and demotion of sole active super-admin', async () => {
      await assert.rejects(
        async () => {
          await changeGuardHook({
            data: { role: 'doctor', isActive: false },
            req: singleAdminReq,
            operation: 'update',
            originalDoc: { id: 'admin-001', role: 'super-admin', isActive: true },
          } as any);
        },
        /Cannot deactivate or demote the last remaining active Super Admin/i
      );
    });

    it('ALLOWS deactivation of a super-admin when multiple active super-admins exist', async () => {
      await assert.doesNotReject(async () => {
        const result = await changeGuardHook({
          data: { isActive: false },
          req: multiAdminReq,
          operation: 'update',
          originalDoc: { id: 'admin-001', role: 'super-admin', isActive: true },
        } as any);
        assert.strictEqual(result.isActive, false);
      });
    });

    it('ALLOWS demotion of a super-admin when multiple active super-admins exist', async () => {
      await assert.doesNotReject(async () => {
        const result = await changeGuardHook({
          data: { role: 'assistant' },
          req: multiAdminReq,
          operation: 'update',
          originalDoc: { id: 'admin-001', role: 'super-admin', isActive: true },
        } as any);
        assert.strictEqual(result.role, 'assistant');
      });
    });

    it('ALLOWS routine field updates (name, phone) on sole super-admin without querying DB', async () => {
      let findCalled = false;
      const spyReq = {
        payload: {
          find: async () => {
            findCalled = true;
            return { docs: [], totalDocs: 1 };
          },
        },
      };

      const result = await changeGuardHook({
        data: { name: 'Dr. Updated Super Admin', phone: '+8801712345678' },
        req: spyReq,
        operation: 'update',
        originalDoc: { id: 'admin-001', role: 'super-admin', isActive: true },
      } as any);

      assert.strictEqual(findCalled, false, 'Routine field updates MUST NOT trigger database lookup');
      assert.strictEqual(result.name, 'Dr. Updated Super Admin');
    });

    it('ALLOWS updates to non-super-admin users without querying DB', async () => {
      let findCalled = false;
      const spyReq = {
        payload: {
          find: async () => {
            findCalled = true;
            return { docs: [], totalDocs: 1 };
          },
        },
      };

      const result = await changeGuardHook({
        data: { isActive: false, role: 'assistant' },
        req: spyReq,
        operation: 'update',
        originalDoc: { id: 'doc-001', role: 'doctor', isActive: true },
      } as any);

      assert.strictEqual(findCalled, false, 'Modifying non-super-admins MUST NOT trigger database lookup');
      assert.strictEqual(result.isActive, false);
    });

    it('ALLOWS updating already-inactive super-admin without querying DB', async () => {
      let findCalled = false;
      const spyReq = {
        payload: {
          find: async () => {
            findCalled = true;
            return { docs: [], totalDocs: 1 };
          },
        },
      };

      const result = await changeGuardHook({
        data: { role: 'assistant' },
        req: spyReq,
        operation: 'update',
        originalDoc: { id: 'admin-002', role: 'super-admin', isActive: false },
      } as any);

      assert.strictEqual(findCalled, false, 'Modifying inactive super-admin MUST NOT trigger database lookup');
      assert.strictEqual(result.role, 'assistant');
    });

    it('ALLOWS create operations without querying DB', async () => {
      let findCalled = false;
      const spyReq = {
        payload: {
          find: async () => {
            findCalled = true;
            return { docs: [], totalDocs: 1 };
          },
        },
      };

      const result = await changeGuardHook({
        data: { name: 'New User', role: 'assistant', isActive: false },
        req: spyReq,
        operation: 'create',
        originalDoc: undefined,
      } as any);

      assert.strictEqual(findCalled, false, 'Create operations MUST NOT trigger database lookup');
    });
  });

  // =========================================================================
  // SECTION 5: AuditLogs Absolute Immutability
  // =========================================================================
  describe('5. AuditLogs Absolute Immutability', () => {
    const roles = [
      { id: '1', role: 'super-admin', isActive: true },
      { id: '2', role: 'doctor', isActive: true },
      { id: '3', role: 'assistant', isActive: true },
      { id: '4', role: 'unknown', isActive: true },
      null,
      undefined,
    ];

    it('guarantees AuditLogs.access.update returns false under 100% of inputs', () => {
      const updateAccess = AuditLogs.access?.update;
      assert.ok(typeof updateAccess === 'function', 'update access must be a function');

      for (const user of roles) {
        const result = (updateAccess as any)({ req: { user } });
        assert.strictEqual(result, false, `Update must be false for user: ${JSON.stringify(user)}`);
      }

      // Test with adversarial craft arguments
      assert.strictEqual((updateAccess as any)({ req: { user: { role: 'super-admin' } }, overrideAccess: true }), false);
      assert.strictEqual((updateAccess as any)({}), false);
    });

    it('guarantees AuditLogs.access.delete returns false under 100% of inputs', () => {
      const deleteAccess = AuditLogs.access?.delete;
      assert.ok(typeof deleteAccess === 'function', 'delete access must be a function');

      for (const user of roles) {
        const result = (deleteAccess as any)({ req: { user } });
        assert.strictEqual(result, false, `Delete must be false for user: ${JSON.stringify(user)}`);
      }

      assert.strictEqual((deleteAccess as any)({ req: { user: { role: 'super-admin' } }, overrideAccess: true }), false);
      assert.strictEqual((deleteAccess as any)({}), false);
    });

    it('guarantees AuditLogs.access.create returns false for REST/Admin direct mutations', () => {
      const createAccess = AuditLogs.access?.create;
      assert.ok(typeof createAccess === 'function', 'create access must be a function');

      for (const user of roles) {
        const result = (createAccess as any)({ req: { user } });
        assert.strictEqual(result, false, `Create must be false for user: ${JSON.stringify(user)}`);
      }
    });
  });

  // =========================================================================
  // SECTION 6: PostgreSQL DDL Syntax & Partial Unique Index Verification
  // =========================================================================
  describe('6. PostgreSQL DDL Syntax & Partial Unique Indexes', () => {
    it('executes up() migration and validates partial unique indexes and table definitions', async () => {
      const executedQueries: string[] = [];

      const mockDb = {
        execute: async (queryObj: any) => {
          let sqlString = '';
          if (typeof queryObj === 'string') {
            sqlString = queryObj;
          } else if (queryObj && Array.isArray(queryObj.queryChunks)) {
            sqlString = queryObj.queryChunks
              .map((c: any) => (typeof c === 'string' ? c : c?.value ?? ''))
              .join(' ');
          } else if (queryObj && typeof queryObj.text === 'string') {
            sqlString = queryObj.text;
          } else {
            sqlString = String(queryObj);
          }
          executedQueries.push(sqlString);
        },
      };

      await up({ db: mockDb } as any);

      assert.ok(executedQueries.length >= 6, 'Migration must execute all 6 schema stages');
      const fullSql = executedQueries.join('\n\n');

      // 1. Check extension
      assert.match(fullSql, /CREATE EXTENSION IF NOT EXISTS "pgcrypto"/i);

      // 2. Check chambers table
      assert.match(fullSql, /CREATE TABLE IF NOT EXISTS "chambers"/i);
      assert.match(fullSql, /"booking_mode" VARCHAR\(20\) NOT NULL DEFAULT 'SLOT' CHECK \("booking_mode" IN \('SLOT', 'SERIAL'\)\)/i);

      // 3. Check schedules table
      assert.match(fullSql, /CREATE TABLE IF NOT EXISTS "schedules"/i);
      assert.match(fullSql, /CONSTRAINT chk_schedule_times CHECK \("end_time" > "start_time"\)/i);

      // 4. Check leaves table
      assert.match(fullSql, /CREATE TABLE IF NOT EXISTS "leaves"/i);
      assert.match(fullSql, /CONSTRAINT chk_leave_dates CHECK \("end_date" >= "start_date"\)/i);

      // 5. Check appointments table
      assert.match(fullSql, /CREATE TABLE IF NOT EXISTS "appointments"/i);
      assert.match(fullSql, /"status" VARCHAR\(30\) NOT NULL DEFAULT 'PENDING' CHECK \("status" IN \('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'\)\)/i);

      // 6. Check Slot Mode Partial Unique Index
      const slotIndexRegex = /CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_chamber_slot"\s+ON "appointments"\s*\("chamber_id",\s*"slot_start"\)\s+WHERE "status" IN \('PENDING',\s*'CONFIRMED'\);/i;
      assert.match(fullSql, slotIndexRegex, 'Slot mode partial unique index must match exact syntax');

      // 7. Check Serial Mode Partial Unique Index
      const serialIndexRegex = /CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_chamber_serial"\s+ON "appointments"\s*\("chamber_id",\s*"appointment_date",\s*"serial_number"\)\s+WHERE "status" IN \('PENDING',\s*'CONFIRMED'\);/i;
      assert.match(fullSql, serialIndexRegex, 'Serial mode partial unique index must match exact syntax');

      // 8. Check Reference Code Uniqueness Index
      assert.match(fullSql, /CREATE UNIQUE INDEX IF NOT EXISTS "unique_appointment_reference_code"\s+ON "appointments"\s*\("reference_code"\);/i);

      // 9. Check OTP pending reaper index
      assert.match(fullSql, /CREATE INDEX IF NOT EXISTS "idx_appointments_expires_at"\s+ON "appointments"\s*\("otp_expires_at"\)\s+WHERE "status" = 'PENDING';/i);
    });

    it('executes down() migration and cleanly rolls back indexes and tables with CASCADE', async () => {
      const rollbackQueries: string[] = [];

      const mockDb = {
        execute: async (queryObj: any) => {
          let sqlString = '';
          if (typeof queryObj === 'string') {
            sqlString = queryObj;
          } else if (queryObj && Array.isArray(queryObj.queryChunks)) {
            sqlString = queryObj.queryChunks
              .map((c: any) => (typeof c === 'string' ? c : c?.value ?? ''))
              .join(' ');
          } else {
            sqlString = String(queryObj);
          }
          rollbackQueries.push(sqlString);
        },
      };

      await down({ db: mockDb } as any);

      const rollbackSql = rollbackQueries.join('\n\n');
      assert.match(rollbackSql, /DROP INDEX IF EXISTS "unique_active_chamber_slot"/i);
      assert.match(rollbackSql, /DROP INDEX IF EXISTS "unique_active_chamber_serial"/i);
      assert.match(rollbackSql, /DROP INDEX IF EXISTS "unique_appointment_reference_code"/i);
      assert.match(rollbackSql, /DROP TABLE IF EXISTS "appointments" CASCADE/i);
      assert.match(rollbackSql, /DROP TABLE IF EXISTS "leaves" CASCADE/i);
      assert.match(rollbackSql, /DROP TABLE IF EXISTS "schedules" CASCADE/i);
      assert.match(rollbackSql, /DROP TABLE IF EXISTS "chambers" CASCADE/i);
    });
  });

  // =========================================================================
  // SECTION 7: Media RBAC & Field-Level Data Integrity Validators
  // =========================================================================
  describe('7. Media RBAC & Field-Level Data Integrity Validators', () => {
    it('verifies Media access control boundaries', () => {
      const assistantUser = { id: 'asst-1', role: 'assistant', isActive: true };
      const doctorUser = { id: 'doc-1', role: 'doctor', isActive: true };
      const superAdminUser = { id: 'admin-1', role: 'super-admin', isActive: true };

      // Media read is public
      assert.strictEqual((Media.access?.read as any)({ req: { user: null } }), true);

      // Media create/update requires authenticated active user
      assert.strictEqual((Media.access?.create as any)({ req: { user: null } }), false);
      assert.strictEqual((Media.access?.create as any)({ req: { user: assistantUser } }), true);
      assert.strictEqual((Media.access?.create as any)({ req: { user: doctorUser } }), true);

      // Media delete is restricted to super-admin or doctor (assistant cannot delete media)
      assert.strictEqual((Media.access?.delete as any)({ req: { user: null } }), false);
      assert.strictEqual((Media.access?.delete as any)({ req: { user: assistantUser } }), false);
      assert.strictEqual((Media.access?.delete as any)({ req: { user: doctorUser } }), true);
      assert.strictEqual((Media.access?.delete as any)({ req: { user: superAdminUser } }), true);
    });

    it('enforces strict Bangladesh phone number validation regex in Users', () => {
      const phoneField = Users.fields.find((f: any) => f.name === 'phone');
      assert.ok(phoneField, 'phone field must exist on Users');
      const validate = (phoneField as any).validate;
      assert.ok(typeof validate === 'function', 'phone validator must be a function');

      // Valid BD numbers
      assert.strictEqual(validate('+8801712345678'), true);
      assert.strictEqual(validate('+8801812345678'), true);
      assert.strictEqual(validate('+8801912345678'), true);
      assert.strictEqual(validate('+8801312345678'), true);
      assert.strictEqual(validate('+8801412345678'), true);
      assert.strictEqual(validate('+8801512345678'), true);
      assert.strictEqual(validate('+8801612345678'), true);

      // Invalid BD numbers
      assert.notStrictEqual(validate('01712345678'), true, 'Must reject missing +88');
      assert.notStrictEqual(validate('+8801212345678'), true, 'Must reject invalid operator digit 2');
      assert.notStrictEqual(validate('+88017123456'), true, 'Must reject short number (10 digits)');
      assert.notStrictEqual(validate('+88017123456789'), true, 'Must reject long number (12 digits)');
      assert.notStrictEqual(validate('+1234567890'), true, 'Must reject international format');
      assert.notStrictEqual(validate('+880171234567X'), true, 'Must reject alphanumeric phone');
      assert.notStrictEqual(validate(null), true, 'Must reject non-string');
    });

    it('enforces BMDC Registration Number mandatory validation in DoctorProfile', () => {
      const bmdcField = DoctorProfile.fields.find((f: any) => f.name === 'bmdcRegistrationNumber');
      assert.ok(bmdcField, 'bmdcRegistrationNumber field must exist');
      const validate = (bmdcField as any).validate;
      assert.ok(typeof validate === 'function', 'BMDC validator must be a function');

      assert.strictEqual(validate('A-54321'), true);
      assert.strictEqual(validate('98765'), true);
      assert.notStrictEqual(validate(''), true, 'Must reject empty BMDC');
      assert.notStrictEqual(validate('   '), true, 'Must reject whitespace-only BMDC');
      assert.notStrictEqual(validate(null), true, 'Must reject null BMDC');
    });
  });

  // =========================================================================
  // SECTION 8: Audit Log Hooks & Recursion Safeguards
  // =========================================================================
  describe('8. Audit Log Hooks & Recursion Safeguards', () => {
    it('prevents infinite recursion when audit-logs collection triggers hooks', async () => {
      const { createAuditLogAfterChange, createAuditLogAfterDelete } = await import('../src/hooks/auditLogHook');

      let createCalled = false;
      const fakeReq = {
        payload: {
          create: async () => {
            createCalled = true;
          },
        },
      };

      // Calling change hook on audit-logs collection itself must return immediately
      await createAuditLogAfterChange({
        doc: { id: 'audit-1' },
        previousDoc: {},
        operation: 'create',
        req: fakeReq,
        collection: { slug: 'audit-logs' },
      } as any);

      assert.strictEqual(createCalled, false, 'Must NOT create audit log when collection is audit-logs (prevent recursion)');

      await createAuditLogAfterDelete({
        doc: { id: 'audit-1' },
        req: fakeReq,
        collection: { slug: 'audit-logs' },
      } as any);

      assert.strictEqual(createCalled, false, 'Must NOT create audit log on delete when collection is audit-logs');
    });
  });
});
