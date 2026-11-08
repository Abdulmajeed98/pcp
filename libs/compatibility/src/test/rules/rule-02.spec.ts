import { type Build, judgeBuild } from '../../index';

describe("rule 2: the CPU's socket among the cooler's", () => {
  it("passes a cooler that lists the CPU's socket", () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } },
      cpuCooler: { id: 'the-cooler', specifications: { cpu_sockets: ['AM4', 'AM5'] } },
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 2, outcome: 'passes', parts: ['the-cpu', 'the-cooler'] },
    ]);
  });

  it("finds a Problem in a cooler that does not list the CPU's socket", () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } },
      cpuCooler: { id: 'the-cooler', specifications: { cpu_sockets: ['AM4', 'LGA 1700'] } },
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 2, outcome: 'problem', parts: ['the-cpu', 'the-cooler'] },
    ]);
  });

  it("is unchecked when the cooler's sockets are missing", () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } },
      cpuCooler: { id: 'the-cooler', specifications: {} },
    };

    expect(judgeBuild(build)).toEqual([
      {
        rule: 2,
        outcome: 'unchecked',
        missing: [{ part: 'the-cooler', path: 'cpu_sockets' }],
      },
    ]);
  });

  it("is unchecked when the CPU's socket is missing", () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: {} },
      cpuCooler: { id: 'the-cooler', specifications: { cpu_sockets: ['AM4', 'AM5'] } },
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 2, outcome: 'unchecked', missing: [{ part: 'the-cpu', path: 'socket' }] },
    ]);
  });
});
