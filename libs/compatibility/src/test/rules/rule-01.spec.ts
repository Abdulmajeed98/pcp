import { type Build, judgeBuild } from '../../index';

describe("rule 1: the CPU's socket and the motherboard's", () => {
  it("passes a CPU of the motherboard's socket", () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } },
      motherboard: { id: 'the-board', specifications: { socket: 'AM5' } },
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 1, outcome: 'passes', parts: ['the-cpu', 'the-board'] },
    ]);
  });

  it("finds a Problem in a CPU of another socket than the motherboard's", () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: { socket: 'AM4' } },
      motherboard: { id: 'the-board', specifications: { socket: 'AM5' } },
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 1, outcome: 'problem', parts: ['the-cpu', 'the-board'] },
    ]);
  });

  it("is unchecked when the CPU's socket is missing", () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: {} },
      motherboard: { id: 'the-board', specifications: { socket: 'AM5' } },
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 1, outcome: 'unchecked', missing: [{ part: 'the-cpu', path: 'socket' }] },
    ]);
  });

  it("is unchecked when the motherboard's socket is missing", () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: { socket: 'AM5' } },
      motherboard: { id: 'the-board', specifications: {} },
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 1, outcome: 'unchecked', missing: [{ part: 'the-board', path: 'socket' }] },
    ]);
  });

  describe('a dual-socket board, written "2 x <socket>"', () => {
    it('takes a CPU of that socket', () => {
      const build: Build = {
        cpu: { id: 'the-cpu', specifications: { socket: 'LGA 2011-3' } },
        motherboard: { id: 'the-board', specifications: { socket: '2 x LGA 2011-3' } },
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 1, outcome: 'passes', parts: ['the-cpu', 'the-board'] },
      ]);
    });

    it('takes no CPU of another socket, even one whose name begins the same', () => {
      const build: Build = {
        cpu: { id: 'the-cpu', specifications: { socket: 'LGA 2011' } },
        motherboard: { id: 'the-board', specifications: { socket: '2 x LGA 2011-3' } },
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 1, outcome: 'problem', parts: ['the-cpu', 'the-board'] },
      ]);
    });
  });

  describe('a board with its CPU built in, written "Integrated …"', () => {
    it('makes a Problem of any CPU', () => {
      const build: Build = {
        cpu: { id: 'the-cpu', specifications: { socket: 'LGA 1700' } },
        motherboard: { id: 'the-board', specifications: { socket: 'Integrated Atom' } },
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 1, outcome: 'problem', parts: ['the-cpu', 'the-board'] },
      ]);
    });

    it("makes a Problem of a CPU written with the board's own socket", () => {
      const build: Build = {
        cpu: { id: 'the-cpu', specifications: { socket: 'Integrated Atom' } },
        motherboard: { id: 'the-board', specifications: { socket: 'Integrated Atom' } },
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 1, outcome: 'problem', parts: ['the-cpu', 'the-board'] },
      ]);
    });

    it('makes a Problem of a CPU whose own socket is missing', () => {
      const build: Build = {
        cpu: { id: 'the-cpu', specifications: {} },
        motherboard: { id: 'the-board', specifications: { socket: 'Integrated Xeon D' } },
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 1, outcome: 'problem', parts: ['the-cpu', 'the-board'] },
      ]);
    });
  });

  it('is unchecked, naming both sockets, when both are missing', () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: {} },
      motherboard: { id: 'the-board', specifications: {} },
    };

    expect(judgeBuild(build)).toEqual([
      {
        rule: 1,
        outcome: 'unchecked',
        missing: [
          { part: 'the-cpu', path: 'socket' },
          { part: 'the-board', path: 'socket' },
        ],
      },
    ]);
  });
});
