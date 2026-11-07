import { rule1 } from './rule-01';
import { rule2 } from './rule-02';
import { rule3 } from './rule-03';
import { rule4 } from './rule-04';
import type { Rule } from './statement';

// Every Compatibility Rule, in rule order (CMP-1).
export const rules: readonly Rule[] = [rule1, rule2, rule3, rule4];
