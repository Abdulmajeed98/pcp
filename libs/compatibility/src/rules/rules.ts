import { rule1 } from './rule-01';
import { rule2 } from './rule-02';
import { rule3 } from './rule-03';
import { rule4 } from './rule-04';
import { rule5 } from './rule-05';
import { rule6 } from './rule-06';
import { rule7 } from './rule-07';
import type { Rule } from './statement';

// Every Compatibility Rule, in rule order (CMP-1).
export const rules: readonly Rule[] = [rule1, rule2, rule3, rule4, rule5, rule6, rule7];
