import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('App route loading', () => {
  it('lazy loads route pages to keep the initial bundle smaller', () => {
    const appPath = path.resolve(__dirname, '..', 'App.tsx');
    const source = fs.readFileSync(appPath, 'utf8');

    expect(source).toMatch(/lazy\(\(\) => import\('\.\/pages\/Atlas'\)\)/);
    expect(source).toMatch(/lazy\(\(\) => import\('\.\/pages\/Builder'\)\)/);
    expect(source).toMatch(/lazy\(\(\) => import\('\.\/pages\/Flows'\)\)/);
    expect(source).toMatch(/<Suspense/);
  });
});
