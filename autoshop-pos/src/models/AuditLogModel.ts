import { Model } from '@nozbe/watermelondb';
import { text, date } from '@nozbe/watermelondb/decorators';

export class AuditLogModel extends Model {
  static table = 'audit_logs';

  @date('timestamp') timestamp!: Date;
  @text('user_id') userId!: string;
  @text('user_name') userName!: string;
  @text('action_type') actionType!: string;
  @text('entity_type') entityType!: string;
  @text('entity_id') entityId!: string;
  @text('before') before!: string;
  @text('after') after!: string;
  @text('note') note!: string;
}
