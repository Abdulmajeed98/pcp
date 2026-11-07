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

  it('judges a Build with a CPU, a cooler, a motherboard, RAM and a case by rules 1 to 7', () => {
    const build: Build = {
      cpu: {
        id: 'the-cpu',
        specifications: { socket: 'AM5', specifications: { memory: { types: ['DDR5'] } } },
      },
      cpuCooler: { id: 'the-cooler', specifications: { cpu_sockets: ['AM5'] } },
      motherboard: {
        id: 'the-board',
        specifications: {
          socket: 'AM5',
          form_factor: 'ATX',
          memory: { ram_type: 'DDR5', slots: 4, max: 192 },
        },
      },
      ram: [
        {
          id: 'the-kit',
          quantity: 1,
          specifications: { ram_type: 'DDR5', modules: { quantity: 2, capacity_gb: 16 } },
        },
      ],
      case: {
        id: 'the-case',
        specifications: { supported_motherboard_form_factors: ['ATX'] },
      },
    };

    expect(judgeBuild(build).map((outcome) => outcome.rule)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
