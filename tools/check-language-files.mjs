// Compares the language files, so that a fault in one language is found
// before anyone opens a page in it. `pnpm check` runs it. It needs neither
// Docker nor a browser.
//
// The files are in `libs/i18n/src/messages`, in three sets: the shared terms,
// the Shopper app's text and the dashboard's text. A set is one file for each
// language. English is the source: its messages define what the other two
// languages must hold. For each set, the check fails when a message of the
// English file is missing from another language, when another language holds
// a message the English file does not, when a message cannot be read in its
// set's format, and when a message names different placeholders in different
// languages. A message that counts must have every plural form its language
// has, and a form that stands for many counts must show every value the
// message names. A shared term must be plain text, and a name at the top of
// the shared terms must not be at the top of a frontend's own set too.
//
// It also fails when a message lets its library format a number, and when a
// message holds an Arabic-Indic digit. next-intl and i18next each format a
// number in the page's language, and a Kurdish page then shows Arabic-Indic
// digits, which LANG-5 rules out. A number reaches a message as text, written
// by `formatNumber` in `i18n`.
//
// Each failure names the file, the message and what is wrong with it.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const folder = join(root, 'libs/i18n/src/messages');

// The platform's three languages, as `i18n` states them. `i18n` is
// TypeScript, which this script cannot import, so they are written out here.
const languages = ['ckb', 'ar', 'en'];

// Each language's name in English, for what the check says.
const inEnglish = { ckb: 'Kurdish', ar: 'Arabic', en: 'English' };

// The plural forms a language has, as Intl names them: `one` and `other` for
// Kurdish and English, and six for Arabic. next-intl and i18next both pick a
// form by them.
function pluralForms(language, type = 'cardinal') {
  return new Intl.PluralRules(language, { type }).resolvedOptions().pluralCategories;
}

// The plural forms that stand for many counts. A form for none, one or two
// may say its count in a word, as Arabic does. One of these cannot, so it
// shows every value its message names, the count among them.
const formsForManyCounts = ['few', 'many', 'other'];

// The digits a message never holds: ٠ to ٩, the Arabic set, and ۰ to ۹, the
// Persian set. Every number the platform shows is in Western digits.
const anArabicIndicDigit = /[٠-٩۰-۹]/;

// next-intl reads a message with `intl-messageformat`, which reads it with
// `@formatjs/icu-messageformat-parser`. Both are found through next-intl's
// own dependencies, so that the check reads a message with the very release
// next-intl does.
const fromTheRoot = createRequire(join(root, 'package.json'));
const fromNextIntl = createRequire(fromTheRoot.resolve('next-intl'));
const fromUseIntl = createRequire(fromNextIntl.resolve('use-intl'));
const intlMessageFormat = fromUseIntl.resolve('intl-messageformat');
const { IntlMessageFormat } = await import(intlMessageFormat);
const { TYPE } = await import(
  createRequire(intlMessageFormat).resolve('@formatjs/icu-messageformat-parser')
);

// The elements of a message, as the parser reads it, that name a value.
const namesAValue = [
  TYPE.argument,
  TYPE.number,
  TYPE.date,
  TYPE.time,
  TYPE.select,
  TYPE.plural,
];

// The elements that have next-intl format the value they name, by what each
// formats it as.
const formattedAs = {
  [TYPE.number]: 'number',
  [TYPE.date]: 'date',
  [TYPE.time]: 'time',
};

// Reads a message of the Shopper app's set, which is in next-intl's format,
// ICU. It gives the placeholders the message names, a value as `{name}` and
// a tag as `<name>`, or what is wrong with it. A message that counts is
// compared as a whole, because a form may leave out the count, as Arabic does
// when it says the count in a word. A message that writes `#`, or formats a
// value as a number, a date or a time, lets next-intl format it in the
// page's language.
function readNextIntlMessage(text, language) {
  let elements;
  try {
    elements = new IntlMessageFormat(text, language).getAst();
  } catch (error) {
    const at = error.location?.start?.offset;
    return {
      problem: `cannot be read in next-intl's format: ${error.message}${at === undefined ? '' : `, at character ${at + 1}`}.`,
    };
  }

  const problems = [];
  // The placeholders a list of elements names, inside its tags, its choices
  // and its plurals too.
  const placeholdersIn = (each) => {
    const placeholders = new Set();
    for (const element of each) {
      if (namesAValue.includes(element.type)) placeholders.add(`{${element.value}}`);
      if (element.type in formattedAs) {
        problems.push(
          `formats {${element.value}} itself, as a ${formattedAs[element.type]}. next-intl would format it in the page's language, and a Kurdish page would show Arabic-Indic digits (LANG-5). Give the message the text that formatNumber writes.`,
        );
      }
      if (element.type === TYPE.pound) {
        problems.push(
          `writes its count with "#". next-intl would format the count in the page's language, and a Kurdish page would show Arabic-Indic digits (LANG-5). Give the message the count as text too, written by formatNumber, as {countText}.`,
        );
      }
      if (element.type === TYPE.tag) {
        placeholders.add(`<${element.value}>`);
        for (const named of placeholdersIn(element.children)) placeholders.add(named);
      }
      if (element.type === TYPE.select || element.type === TYPE.plural) {
        const inEachOption = new Map(
          Object.entries(element.options).map(([option, { value }]) => [
            option,
            placeholdersIn(value),
          ]),
        );
        const inAny = new Set([...inEachOption.values()].flatMap((named) => [...named]));
        for (const named of inAny) placeholders.add(named);

        if (element.type === TYPE.plural) {
          const lacking = pluralForms(language, element.pluralType).filter(
            (form) => !inEachOption.has(form),
          );
          if (lacking.length > 0) {
            problems.push(
              `lacks the plural ${lacking.length === 1 ? 'form' : 'forms'} ${lacking.join(', ')} of {${element.value}}, which ${inEnglish[language]} has.`,
            );
          }
          for (const form of formsForManyCounts) {
            const left = [...inAny].filter(
              (named) => inEachOption.get(form)?.has(named) === false,
            );
            if (left.length > 0) {
              problems.push(
                `its form ${form} of {${element.value}} leaves out ${left.join(', ')}, which a form for many counts shows.`,
              );
            }
          }
        }
      }
    }
    return placeholders;
  };
  const placeholders = placeholdersIn(elements);

  return problems.length > 0 ? { problem: problems.join(' ') } : { placeholders };
}

// Reads a message of the dashboard's set, which is in i18next's own format,
// as i18next and react-i18next's `Trans` read it. An element is written in
// angle brackets, as `<name/>` or `<name>…</name>`, and another message is
// nested as `$t(key)`. It gives what the message names, which are its
// placeholders, as `<name>` and `$t(key)`, or what is wrong with it. An angle
// bracket that starts or ends no element, and an element that is not closed
// where it should be, cannot be read.
//
// i18next also reads a value written in double braces, as `{{name}}`. The
// dashboard writes none: it puts every value into an element its message
// names, so that React shows it as text. In double braces i18next would
// write a number with no grouping, or format it in the page's language.
function readI18nextMessage(text) {
  const placeholders = new Set();
  const open = [];
  const pieces =
    /\$t\(([^()]*)\)|<(\/?)([A-Za-z0-9]+)\s*(\/?)>|\{\{([^{}]*)\}\}|<|>|\{\{|\}\}/g;
  for (const [piece, nested, closing, name, selfClosing, value] of text.matchAll(pieces)) {
    if (nested !== undefined) {
      placeholders.add(`$t(${nested.trim()})`);
    } else if (value !== undefined) {
      const named = value.split(',')[0].trim().replace(/^-\s*/, '');
      if (named === '') return { problem: `cannot be read: "${piece}" names no value.` };
      return {
        problem: `writes a value in double braces, "${piece}". Put it into an element the message names, such as <${named}/>: in double braces i18next would write a number with no grouping, or format it in the page's language, and a Kurdish page would show Arabic-Indic digits (LANG-5).`,
      };
    } else if (name === undefined) {
      return { problem: `cannot be read: its "${piece}" starts or ends nothing.` };
    } else if (closing !== '') {
      if (selfClosing !== '' || open.pop() !== name) {
        return {
          problem: `cannot be read: it closes <${name}> where no <${name}> is open.`,
        };
      }
    } else {
      placeholders.add(`<${name}>`);
      if (selfClosing === '') open.push(name);
    }
  }
  if (open.length > 0) {
    return { problem: `cannot be read: it leaves <${open.at(-1)}> open.` };
  }

  return { placeholders };
}

// Reads a shared term. Both frontends read it, each with its own library, and
// plain text is the one thing both read alike. So a shared term holds no
// placeholder and no markup: no brace and no angle bracket.
function readSharedTerm(text) {
  return /[{}<>]/.test(text)
    ? { problem: 'holds a placeholder or markup, and a shared term is plain text.' }
    : { placeholders: new Set() };
}

// i18next writes a message that counts as one key for each plural form, such
// as `parts_one` and `parts_other`.
const aPluralForm = /^(.+)_(zero|one|two|few|many|other)$/;

// The three sets, the shared terms first. The keys of a message that counts,
// written as i18next writes them, are read as that one message: in the
// dashboard's set, and in the shared terms, which the dashboard reads with
// i18next. Each frontend adds the shared terms to its own set, with its own
// set's names over them, so that a name at the top of both would hide the
// shared terms of that name.
const sets = [
  { name: 'shared', read: readSharedTerm, keysForEachForm: true },
  {
    name: 'shopper',
    read: readNextIntlMessage,
    keysForEachForm: false,
    addsTheShared: true,
  },
  {
    name: 'dashboard',
    read: readI18nextMessage,
    keysForEachForm: true,
    addsTheShared: true,
  },
];

const problems = [];

// The messages of one file, by their keys, with the key's parts joined by
// dots, as a frontend asks for them, and the names at the top of the file. A
// message that counts, in a set that writes it with a key for each form, is
// one message with its forms.
function readFile(file, keysForEachForm) {
  const messages = new Map();
  const add = (key, text) => {
    const form = keysForEachForm ? aPluralForm.exec(key) : null;
    if (form === null) {
      messages.set(key, { text });
      return;
    }
    const [, counted, name] = form;
    const message = messages.get(counted) ?? { forms: new Map() };
    if (message.forms === undefined) {
      problems.push(`${file}, "${counted}": is both a message and a message that counts.`);
      return;
    }
    message.forms.set(name, text);
    messages.set(counted, message);
  };
  const walk = (value, path) => {
    if (typeof value === 'string') add(path.join('.'), value);
    else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, inner] of Object.entries(value)) walk(inner, [...path, key]);
    } else {
      problems.push(`${file}, "${path.join('.')}": is not text.`);
    }
  };

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(join(root, file), 'utf8'));
  } catch (error) {
    problems.push(`${file}: cannot be read as JSON: ${error.message}`);
    return undefined;
  }
  walk(parsed, []);
  return { messages, namesAtTheTop: Object.keys(parsed) };
}

// Reads one message in its language: the placeholders it names, all its
// forms together, or what is wrong with it. A message that counts holds
// exactly the plural forms its language has.
function readMessage(set, file, key, message, language) {
  const say = (what) => problems.push(`${file}, "${key}": ${what}`);
  if (set.name === 'shared' && message.forms !== undefined) {
    say(
      'is a message that counts, as i18next writes one, and a shared term is plain text.',
    );
    return undefined;
  }

  if (message.forms !== undefined) {
    const forms = pluralForms(language);
    const lacking = forms.filter((form) => !message.forms.has(form));
    const extra = [...message.forms.keys()].filter((form) => !forms.includes(form));
    if (lacking.length > 0) {
      say(
        `lacks the plural ${lacking.length === 1 ? 'form' : 'forms'} ${lacking.join(', ')}, which ${inEnglish[language]} has.`,
      );
    }
    if (extra.length > 0) {
      say(
        `has the plural ${extra.length === 1 ? 'form' : 'forms'} ${extra.join(', ')}, which ${inEnglish[language]} does not have.`,
      );
    }
  }

  const texts = message.forms ?? new Map([['', message.text]]);
  const inEachForm = new Map();
  for (const [form, text] of texts) {
    const digit = anArabicIndicDigit.exec(text)?.[0];
    if (digit !== undefined) {
      say(
        `holds the Arabic-Indic digit "${digit}". Every number the platform shows is in Western digits (LANG-5).`,
      );
      return undefined;
    }
    const { problem, placeholders } = set.read(text, language);
    if (problem !== undefined) {
      say(problem);
      return undefined;
    }
    inEachForm.set(form, placeholders);
  }

  const placeholders = new Set([...inEachForm.values()].flatMap((named) => [...named]));
  for (const form of formsForManyCounts) {
    const left = [...placeholders].filter(
      (named) => inEachForm.get(form)?.has(named) === false,
    );
    if (left.length > 0) {
      say(
        `its form ${form} leaves out ${left.join(', ')}, which a form for many counts shows.`,
      );
    }
  }
  return placeholders;
}

// The placeholders of a message written out in one order, so that a problem
// can name them and two messages can be compared by them.
function listed(placeholders) {
  return placeholders.size === 0 ? 'no placeholder' : [...placeholders].sort().join(', ');
}

// The names at the top of the shared terms' files, by language.
let namesAtTheTopOfTheShared;

for (const set of sets) {
  const files = Object.fromEntries(
    languages.map((language) => [
      language,
      relative(root, join(folder, set.name, `${language}.json`)),
    ]),
  );
  const contents = Object.fromEntries(
    languages.map((language) => [language, readFile(files[language], set.keysForEachForm)]),
  );
  if (languages.some((language) => contents[language] === undefined)) continue;

  if (set.name === 'shared') {
    namesAtTheTopOfTheShared = Object.fromEntries(
      languages.map((language) => [language, contents[language].namesAtTheTop]),
    );
  }
  if (set.addsTheShared && namesAtTheTopOfTheShared !== undefined) {
    for (const language of languages) {
      for (const name of contents[language].namesAtTheTop) {
        if (namesAtTheTopOfTheShared[language].includes(name)) {
          problems.push(
            `${files[language]}, "${name}": is a name at the top of the shared terms too. The frontend adds the shared terms to this set, and this "${name}" would hide theirs.`,
          );
        }
      }
    }
  }

  const english = contents.en.messages;
  const placeholdersInEnglish = new Map(
    [...english].map(([key, message]) => [
      key,
      readMessage(set, files.en, key, message, 'en'),
    ]),
  );

  for (const language of languages.filter((each) => each !== 'en')) {
    const file = files[language];
    const messages = contents[language].messages;
    for (const key of english.keys()) {
      if (!messages.has(key)) {
        problems.push(`${file}, "${key}": is missing. The English file has it.`);
      }
    }
    for (const [key, message] of messages) {
      if (!english.has(key)) {
        problems.push(
          `${file}, "${key}": is not in the English file, which is the source.`,
        );
        continue;
      }
      const counts = message.forms !== undefined;
      if (counts !== (english.get(key).forms !== undefined)) {
        problems.push(
          `${file}, "${key}": ${counts ? 'counts, and the English one does not' : 'does not count, and the English one does'}.`,
        );
        continue;
      }

      const placeholders = readMessage(set, file, key, message, language);
      const inTheEnglishOne = placeholdersInEnglish.get(key);
      if (placeholders === undefined || inTheEnglishOne === undefined) continue;
      if (listed(placeholders) !== listed(inTheEnglishOne)) {
        problems.push(
          `${file}, "${key}": names ${listed(placeholders)}, where the English one names ${listed(inTheEnglishOne)}.`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.log(problem);
  console.log(
    `${problems.length === 1 ? 'One problem was' : `${problems.length} problems were`} found in the language files, in libs/i18n/src/messages.`,
  );
  process.exitCode = 1;
}
