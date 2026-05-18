export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin?: {
    id: string;
    email: string;
  };
}
