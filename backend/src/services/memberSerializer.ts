import type { MemberDocument } from '../models/Member.js';
import type { MemberRecord } from '../types/index.js';

export function toMemberRecord(member: MemberDocument & { _id: { toString(): string } }): MemberRecord {
  return {
    id: member._id.toString(),
    name: member.name,
    roles: member.roles,
    notes: member.notes,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}
