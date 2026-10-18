// src/hooks/auditLogHook.ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

export const createAuditLogAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  collection,
}) => {
  // Prevent infinite loops if audit logs themselves trigger change hooks
  if (collection.slug === 'audit-logs') return;

  try {
    const user = req.user as { id?: string | number; role?: string } | null;
    const ip =
      req.headers?.get?.('x-forwarded-for') ||
      req.headers?.get?.('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers?.get?.('user-agent') || 'system';

    let diff: Record<string, { before: unknown; after: unknown }> | null = null;

    if (operation === 'update' && previousDoc) {
      diff = {};
      const allKeys = new Set([...Object.keys(doc), ...Object.keys(previousDoc)]);
      allKeys.forEach((key) => {
        if (key === 'updatedAt' || key === 'createdAt') return;
        if (JSON.stringify(doc[key]) !== JSON.stringify(previousDoc[key])) {
          diff![key] = {
            before: previousDoc[key],
            after: doc[key],
          };
        }
      });
    }

    await req.payload.create({
      collection: 'audit-logs' as any,
      overrideAccess: true, // Bypass create: () => false rule for internal hook
      data: {
        action: operation === 'create' ? 'CREATE' : 'UPDATE',
        collectionName: collection.slug,
        documentId: String(doc.id),
        user: user?.id,
        userRole: user?.role || 'anonymous',
        ipAddress: Array.isArray(ip) ? ip[0] : ip,
        userAgent: typeof userAgent === 'string' ? userAgent.substring(0, 255) : 'system',
        diff: diff || { snapshot: doc },
        timestamp: new Date().toISOString(),
      } as any,
    });
  } catch (err) {
    // Log error without breaking business transaction
    console.error('AuditLogHook Error:', err);
  }
};

export const createAuditLogAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
  collection,
}) => {
  if (collection.slug === 'audit-logs') return;

  try {
    const user = req.user as { id?: string | number; role?: string } | null;
    const ip =
      req.headers?.get?.('x-forwarded-for') ||
      req.headers?.get?.('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers?.get?.('user-agent') || 'system';

    await req.payload.create({
      collection: 'audit-logs' as any,
      overrideAccess: true,
      data: {
        action: 'DELETE',
        collectionName: collection.slug,
        documentId: String(doc.id),
        user: user?.id,
        userRole: user?.role || 'anonymous',
        ipAddress: Array.isArray(ip) ? ip[0] : ip,
        userAgent: typeof userAgent === 'string' ? userAgent.substring(0, 255) : 'system',
        diff: { deletedDocument: doc },
        timestamp: new Date().toISOString(),
      } as any,
    });
  } catch (err) {
    console.error('AuditLogHook Delete Error:', err);
  }
};
