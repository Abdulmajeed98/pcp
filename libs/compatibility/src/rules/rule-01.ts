import { type Socket, sockets } from '../fixed-sets';
import { fact, problemWhen, whatever } from './findings';
import { rule } from './statement';

// Rule 1: the CPU's socket differs from the motherboard's. A board written
// "2 x <socket>" holds two of that socket and takes a CPU of it. A board
// written "Integrated …" brings its own CPU, so any CPU added to it is a
// Compatibility Problem, whatever its socket (the owner's decision of 15
// October 2026). A board written "LGA 2011-3 Narrow" or "2 x LGA 2011-3
// Narrow" takes a CPU of LGA 2011-3: "Narrow" names the mounting of its
// cooler, and no CPU names it (the owner's decision of 8 November 2026).
export const rule1 = rule({
  number: 1,
  involves: { cpu: ['socket'], motherboard: ['socket'] },
  judge: ({ cpu, motherboard }) =>
    problemWhen(
      whatever(motherboard.read('socket'), sockets, (board) =>
        whatever(cpu.read('socket'), sockets, (own) =>
          fact(hasItsCpuBuiltIn(board) || !takes(board, own)),
        ),
      ),
    ),
});

function hasItsCpuBuiltIn(board: Socket): boolean {
  return board.startsWith('Integrated ');
}

// The socket of the CPU a board written "Narrow" takes.
const narrowBoardsTake: Partial<Record<Socket, Socket>> = {
  'LGA 2011-3 Narrow': 'LGA 2011-3',
  '2 x LGA 2011-3 Narrow': 'LGA 2011-3',
};

function takes(board: Socket, own: Socket): boolean {
  return board === own || board === `2 x ${own}` || narrowBoardsTake[board] === own;
}
