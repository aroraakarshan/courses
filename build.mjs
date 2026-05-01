import { cp, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const PUBLIC = 'public';

// Courses to build — each entry is a submodule folder name
const COURSES = [
  {
    dir: 'yaml-from-zero',
    installCmd: 'npm install',
    buildCmd: 'npm run build',
    env: { BASE_PATH: '/yaml-from-zero' },
  },
];

await mkdir(PUBLIC, { recursive: true });

for (const course of COURSES) {
  const courseDir = join(process.cwd(), course.dir);

  console.log(`\n=== Building ${course.dir} ===`);

  console.log(`Installing ${course.dir} deps...`);
  execSync(course.installCmd, { cwd: courseDir, stdio: 'inherit', env: { ...process.env, ...course.env } });

  console.log(`Building ${course.dir}...`);
  execSync(course.buildCmd, { cwd: courseDir, stdio: 'inherit', env: { ...process.env, ...course.env } });

  const buildDir = join(courseDir, 'build');
  const targetDir = join(PUBLIC, course.dir);
  await cp(buildDir, targetDir, { recursive: true });
  console.log(`Copied ${course.dir}/build → public/${course.dir}`);
}

// Copy PDFs from resources/ to public/resources/
const resourcesDir = join(process.cwd(), 'resources');
const pdfTarget = join(PUBLIC, 'resources');
await mkdir(pdfTarget, { recursive: true });

try {
  const files = await readdir(resourcesDir);
  for (const file of files) {
    if (file.endsWith('.pdf')) {
      await cp(join(resourcesDir, file), join(pdfTarget, file));
      console.log(`Copied ${file} → public/resources/`);
    }
  }
} catch { /* no PDFs yet */ }

console.log('\n=== Submodules built. Astro will handle the rest. ===');
