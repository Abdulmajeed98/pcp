import type { Language } from '../languages';
import ar from './dashboard/ar.json';
import ckb from './dashboard/ckb.json';
import en from './dashboard/en.json';

// The dashboard's text: what the Vendor portal shows, what a component that
// both halves use shows, and the hand-over's message, which the Admin console
// writes for a Vendor to read. Text that only the Admin console shows is
// written in English where it is used, and is not here. English is the
// source: its messages define what the other two languages must hold, and a
// key is type-checked against it.
export type DashboardMessages = typeof en;

// One file for each language, in i18next's own format.
export const dashboardMessages: Record<Language, DashboardMessages> = { ckb, ar, en };
