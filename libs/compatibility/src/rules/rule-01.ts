import { type Socket, sockets } from '../fixed-sets';
import { fact, problemWhen, whatever } from './findings';
import { rule } from './statement';

// Rule 1: the CPU's socket differs from the motherboard's. A board written
// "2 x <socket>" holds two of that socket and takes a CPU of it. A board
// written "Integrated …" brings its own CPU, so any CPU added to it is a
// Compatibility Problem, whatever its socket (the owner's decision of 15
// October 2026).
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

function takes(board: Socket, own: Socket): boolean {
  return board === own || board === `2 x ${own}`;
}
