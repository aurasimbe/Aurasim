const { themeCheckRun } = require('@shopify/theme-check-node');
(async () => {
  for (const t of ['monolith', 'spectrum']) {
    const root = require('path').resolve('build/' + t);
    const res = await themeCheckRun(root, undefined, () => {});
    const offenses = res.offenses || res;
    const rel = offenses.filter(o => !/MissingTemplate|TranslationKeyExists|ValidSchemaName|MatchingTranslations|AppBlockMissingSchema/.test(o.check));
    console.log('==', t, rel.length, 'offenses');
    for (const o of rel) console.log(o.severity, o.check, o.uri.replace(/.*build\//, ''), (o.start && o.start.line + 1) || '', '-', o.message);
  }
})().catch(e => { console.error(e); process.exit(1); });
