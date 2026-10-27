// Optional Node runner; production remains a static site with no build step.
const suites = ['simulation', 'input', 'graphics', 'expansion', 'worldGeneration', 'gamepad', 'controller', 'panels', 'regions', 'gathering'];
const results = [];
for (const suite of suites) {
  const module = await import(`./${suite}.js`);
  const run = Object.values(module).find(value => typeof value === 'function');
  results.push(...run());
}
for (const result of results) console.log(result);
console.log(`\n${results.filter(line => line.startsWith('PASS')).length}/${results.length} checks passed.`);
if (results.some(line => line.startsWith('FAIL'))) process.exitCode = 1;
