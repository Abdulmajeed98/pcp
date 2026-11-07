import { type Build, judgeBuild } from '../index';

describe('judging a Build', () => {
  it('answers no outcome for an empty Build', () => {
    expect(judgeBuild({})).toEqual([]);
  });

  it('answers no outcome for a rule whose Parts the Build does not all hold', () => {
    const build: Build = { cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } } };

    expect(judgeBuild(build)).toEqual([]);
  });

  it('answers the outcome of each rule that applies, in rule order', () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } },
      cpuCooler: { id: 'the-cooler', specifications: { cpu_sockets: ['AM4', 'AM5'] } },
      motherboard: { id: 'the-board', specifications: { socket: 'AM5' } },
    };

    expect(judgeBuild(build).map((outcome) => outcome.rule)).toEqual([1, 2]);
  });
});
