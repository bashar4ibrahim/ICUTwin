import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const projectRoot = process.cwd();

const targets = [
  ['src/components/Dashboard/Dashboard.css', '.dashboard-root'],
  ['src/components/AIRisk/AIRisk.css', '.ai-risk-container'],
  ['src/components/Patients/Patients.css', '.patients-container'],
  ['src/components/Patients/PatientDetail.css', '.patient-detail-container'],
  ['src/components/Vitals/Vitals.css', '.vitals-container'],
  ['src/components/Resources/Resources.css', '.resources-page'],
  ['src/components/SIEM/SIEM.css', '.siem-page'],
  ['src/components/Login/Login.css', '.login-screen'],
  ['src/components/LoadingSkeleton/LoadingSkeleton.css', '.loading-skeleton'],
  ['src/components/ErrorMsg/ErrorMsg.css', '.error-msg'],
];

const isKeyframeStep = (rule) => {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
};

const isAlreadyScoped = (selector, rootSelector) => {
  return (
    selector === rootSelector ||
    selector.startsWith(`${rootSelector} `) ||
    selector.startsWith(`${rootSelector}:`) ||
    selector.startsWith(`${rootSelector}[`) ||
    selector.startsWith(`${rootSelector}.`) ||
    selector.startsWith(`${rootSelector}>`) ||
    selector.startsWith(`${rootSelector}+`) ||
    selector.startsWith(`${rootSelector}~`)
  );
};

for (const [relativeFile, rootSelector] of targets) {
  const filePath = path.join(projectRoot, relativeFile);
  const source = fs.readFileSync(filePath, 'utf8');
  const root = postcss.parse(source, { from: filePath });

  root.walkRules((rule) => {
    if (isKeyframeStep(rule)) {
      return;
    }

    rule.selectors = rule.selectors.map((selector) => {
      const trimmed = selector.trim();

      if (!trimmed) {
        return trimmed;
      }

      if (trimmed === ':root') {
        return rootSelector;
      }

      if (/^(from|to|\d+%)$/i.test(trimmed)) {
        return trimmed;
      }

      if (isAlreadyScoped(trimmed, rootSelector)) {
        return trimmed;
      }

      return `${rootSelector} ${trimmed}`;
    });
  });

  fs.writeFileSync(filePath, root.toString());
  console.log(`Scoped ${relativeFile} -> ${rootSelector}`);
}
