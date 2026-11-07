import { sockets } from '../fixed-sets';
import { includes, not, problemWhen, whatever } from './findings';
import { rule } from './statement';

// Rule 2: the cooler does not list the CPU's socket.
export const rule2 = rule({
  number: 2,
  involves: { cpu: ['socket'], cpuCooler: ['cpu_sockets'] },
  judge: ({ cpu, cpuCooler }) =>
    problemWhen(
      whatever(cpu.read('socket'), sockets, (socket) =>
        not(includes(cpuCooler.read('cpu_sockets'), socket)),
      ),
    ),
});
