import { describe, it, expect } from 'vitest';
import app from './index.js';

describe('Server Health and Imports', () => {
  it('instantiates app properly', () => {
    expect(app).toBeDefined();
  });
});
