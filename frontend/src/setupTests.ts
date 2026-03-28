// jest-dom adds custom matchers like toBeInTheDocument(), toHaveAttribute(), etc.
// This file is automatically picked up by Create React App as setupFilesAfterFramework.
import '@testing-library/jest-dom';

// Polyfill TextEncoder and TextDecoder.
// CRA 5 ships with an older jsdom that does not include these Web API globals,
// but react-router v7 requires them at module load time.
import { TextEncoder, TextDecoder } from 'util';

Object.defineProperty(globalThis, 'TextEncoder', {
  writable: true,
  value: TextEncoder,
});

Object.defineProperty(globalThis, 'TextDecoder', {
  writable: true,
  value: TextDecoder,
});
