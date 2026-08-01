import { Role } from '../database/enums';
import { ForbiddenException } from '@nestjs/common';
import { GroupsService } from './groups.service';

describe('GroupsService.assertAccess', () => {
  const service = Object.create(GroupsService.prototype) as GroupsService;

  it('allows admin for any leader', () => {
    expect(() =>
      service.assertAccess('leader-1', {
        id: 'admin-1',
        email: 'a@a.com',
        role: Role.ADMIN,
        fullName: 'Admin',
      }),
    ).not.toThrow();
  });

  it('allows instructor leader of the group', () => {
    expect(() =>
      service.assertAccess('leader-1', {
        id: 'leader-1',
        email: 'i@a.com',
        role: Role.INSTRUCTOR,
        fullName: 'Instructor',
      }),
    ).not.toThrow();
  });

  it('blocks instructor that is not the leader', () => {
    expect(() =>
      service.assertAccess('leader-1', {
        id: 'other',
        email: 'o@a.com',
        role: Role.INSTRUCTOR,
        fullName: 'Other',
      }),
    ).toThrow(ForbiddenException);
  });
});
