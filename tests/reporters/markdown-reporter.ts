import fs from 'node:fs';
import path from 'node:path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

const TESTS_DIR = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(TESTS_DIR, 'results');
const SCREENSHOTS_DIR = path.join(RESULTS_DIR, 'screenshots');

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

// Drops the root, project and file entries; what is left is the describe blocks and the test name.
const toTitle = (test: TestCase) => test.titlePath().slice(3).join(' › ');

// Writes results/report.md after a run: a summary table, then a section per test with its error,
// text evidence (attach JSON or text in the test) and screenshots embedded as images.
export default class MarkdownReporter implements Reporter {
  // The last attempt of a test wins, so a retried test is reported once.
  private readonly latest = new Map<string, { test: TestCase; result: TestResult }>();

  onTestEnd(test: TestCase, result: TestResult) {
    this.latest.set(test.id, { test, result });
  }

  onEnd() {
    fs.rmSync(SCREENSHOTS_DIR, { recursive: true, force: true });
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    const entries = [...this.latest.values()];
    const count = (...statuses: string[]) =>
      entries.filter(({ result }) => statuses.includes(result.status)).length;

    const lines = [
      '# Test results',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      `Passed ${count('passed')}, failed ${count('failed', 'timedOut')}, skipped ${count('skipped')} of ${entries.length}.`,
      '',
      '| # | Project | Test | Result | Time |',
      '| --- | --- | --- | --- | --- |',
      ...entries.map(
        ({ test, result }, index) =>
          `| ${index + 1} | ${test.parent.project()?.name} | ${toTitle(test).replace(/\|/g, '\\|')} | ${result.status} | ${result.duration} ms |`,
      ),
    ];

    entries.forEach(({ test, result }, index) => lines.push('', ...this.describe(index + 1, test, result)));

    fs.writeFileSync(path.join(RESULTS_DIR, 'report.md'), `${lines.join('\n')}\n`);
  }

  private describe(index: number, test: TestCase, result: TestResult) {
    const file = path.relative(TESTS_DIR, test.location.file).replace(/\\/g, '/');
    const lines = [
      `## ${index}. ${toTitle(test)}`,
      '',
      `- Project: ${test.parent.project()?.name}`,
      `- File: ${file}`,
      `- Result: ${result.status} (${result.duration} ms)`,
    ];

    if (result.error?.message) {
      lines.push('', '```', result.error.message.replace(ANSI_PATTERN, ''), '```');
    }

    result.attachments.forEach((attachment, position) => {
      if (attachment.contentType.startsWith('image/') && attachment.path) {
        const extension = attachment.contentType.split('/')[1];
        const name = `${String(index).padStart(2, '0')}-${slug(attachment.name)}-${position}.${extension}`;

        fs.copyFileSync(attachment.path, path.join(SCREENSHOTS_DIR, name));
        lines.push('', `![${attachment.name}](screenshots/${name})`);
      } else if (attachment.body && /json|text/.test(attachment.contentType)) {
        lines.push('', `**${attachment.name}**`, '', '```', attachment.body.toString(), '```');
      }
    });

    return lines;
  }
}
