import { paginate, paginatedResult } from './pagination.helpers';

describe('pagination helpers', () => {
  it('calculates skip/take safely', () => {
    expect(paginate(2, 10)).toEqual({
      page: 2,
      limit: 10,
      skip: 10,
      take: 10,
    });
  });

  it('clamps invalid values', () => {
    expect(paginate(0, 500)).toEqual({
      page: 1,
      limit: 100,
      skip: 0,
      take: 100,
    });
  });

  it('builds paginated result meta', () => {
    const result = paginatedResult([{ id: 1 }], 25, 1, 10);
    expect(result.meta).toEqual({
      total: 25,
      page: 1,
      limit: 10,
      totalPages: 3,
    });
  });
});
