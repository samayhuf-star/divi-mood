import { makeCode, parseCode } from '../shareCode';
describe('share code', () => {
  it('round-trips', () => {
    const c = makeCode({ name: 'Mia R', lastPeriod: '2026-11-03', cycleLength: 29, periodLength: 5 });
    expect(parseCode(`Join me: ${c}`)).toMatchObject({ name: 'Mia R', lastPeriod: '2026-11-03', cycleLength: 29, periodLength: 5, mode: 'partner' });
  });
  it('rejects junk', () => {
    expect(parseCode('hello')).toBeNull();
    expect(parseCode('DIVI-x.2026-13.1.1')).toBeNull();
  });
});
