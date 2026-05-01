import { readdir, cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const DIST = 'dist';

// Courses to build — each entry is a submodule folder name
const COURSES = [
  {
    dir: 'yaml-from-zero',
    installCmd: 'npm install',
    buildCmd: 'npm run build',
    env: { BASE_PATH: '/yaml-from-zero' },
  },
];

await mkdir(DIST, { recursive: true });

for (const course of COURSES) {
  const courseDir = join(process.cwd(), course.dir);

  console.log(`\n=== Building ${course.dir} ===`);

  // Install dependencies
  console.log(`Installing ${course.dir} deps...`);
  execSync(course.installCmd, { cwd: courseDir, stdio: 'inherit', env: { ...process.env, ...course.env } });

  // Build
  console.log(`Building ${course.dir}...`);
  execSync(course.buildCmd, { cwd: courseDir, stdio: 'inherit', env: { ...process.env, ...course.env } });

  // Copy build output
  const buildDir = join(courseDir, 'build');
  const targetDir = join(DIST, course.dir);
  await cp(buildDir, targetDir, { recursive: true });
  console.log(`Copied ${course.dir}/build → dist/${course.dir}`);
}

// Copy landing page
await cp('index.html', join(DIST, 'index.html'));

// Copy resources (static pages + PDFs)
await cp('resources', join(DIST, 'resources'), { recursive: true });
console.log('Copied resources → dist/resources');

console.log('\n=== All courses built ===');
