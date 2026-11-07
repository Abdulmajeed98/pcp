import { type Build, judgeBuild } from '../index';

describe('judging a Build', () => {
  it('answers no outcome for an empty Build', () => {
    expect(judgeBuild({})).toEqual([]);
  });

  it('answers no outcome for a rule whose Parts the Build does not all hold', () => {
    const build: Build = { cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } } };

    expect(judgeBuild(build)).toEqual([]);
  });
});
