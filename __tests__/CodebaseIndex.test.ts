import { jest } from '@jest/globals';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Define test file types for type safety
interface TestFileTypes {
  [key: string]: string;
}

// Define index entry type
interface IndexEntry {
  path: string;
  type: string;
  exports: string[];
  dependencies: string[];
  usedIn: string[];
  description: string;
  lastUpdated: string;
}

// Mock fs module
jest.mock('fs', () => {
  return {
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(),
    existsSync: jest.fn(),
  };
});

// Mock fast-glob
jest.mock('fast-glob', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

describe('Codebase Index Generator', () => {
  // Setup mock for fast-glob
  const mockGlobFn = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup fast-glob mock
    const fastGlob = require('fast-glob');
    fastGlob.default = mockGlobFn;
  });

  it('should correctly infer file types based on path', async () => {
    // Define test files
    const testFiles: TestFileTypes = {
      'nodes/TestNode/TestNode.node.ts': 'node',
      'credentials/TestCredential.credentials.ts': 'credential',
      'nodes/TestNode/TestNode.node.json': 'codex',
      'docs/README.md': 'doc',
      '__tests__/TestFile.test.ts': 'test',
    };

    // Setup mocks
    mockGlobFn.mockResolvedValueOnce(Object.keys(testFiles));

    // Mock file content for extractExports
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: unknown) => {
      if (typeof filePath === 'string' && filePath.endsWith('.ts')) {
        return 'export class TestClass {}';
      }
      return '';
    });

    // Mock existsSync to return true for our test paths
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // Mock writeFileSync to capture the output
    (fs.writeFileSync as jest.Mock).mockImplementation((path: string, content: string) => {
      // Do nothing, just capture the call
    });

    // Run the script
    await execAsync('ts-node scripts/gen-codebase-index.ts');

    // Check that writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();
    
    // Get the mock calls
    const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
    
    // Parse the JSON content
    const indexData = JSON.parse(writeCall[1]) as IndexEntry[];

    // Verify each file has the correct type
    for (const entry of indexData) {
      expect(entry.type).toBe(testFiles[entry.path]);
    }
  });

  it('should correctly extract exports from TypeScript files', async () => {
    // Mock readFileSync to return different export patterns
    const filePath = 'test/TestExports.ts';
    const fileContent = `
      export class ExportedClass {}
      export const exportedConst = 'value';
      export function exportedFunction() {}
      export interface ExportedInterface {}
      export enum ExportedEnum { A, B }
      export type ExportedType = string;
      const notExported = true;
    `;

    // Setup mocks
    mockGlobFn.mockResolvedValueOnce([filePath]);

    (fs.readFileSync as jest.Mock).mockImplementation((path: unknown) => {
      if (typeof path === 'string' && path.includes('TestExports.ts')) {
        return fileContent;
      }
      return '';
    });

    // Run the script
    await execAsync('ts-node scripts/gen-codebase-index.ts');

    // Check exports in the output
    expect(fs.writeFileSync).toHaveBeenCalled();
    
    // Get the mock calls
    const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
    
    // Parse the JSON content
    const indexData = JSON.parse(writeCall[1]) as IndexEntry[];
    
    // Find the test entry
    const testEntry = indexData.find(e => e.path === filePath);
    
    // Verify exports
    expect(testEntry?.exports).toContain('ExportedClass');
    expect(testEntry?.exports).toContain('exportedConst');
    expect(testEntry?.exports).toContain('exportedFunction');
    expect(testEntry?.exports).toContain('ExportedInterface');
    expect(testEntry?.exports).toContain('ExportedEnum');
    expect(testEntry?.exports).toContain('ExportedType');
    expect(testEntry?.exports).not.toContain('notExported');
  });

  it('should detect when the index is out of date', async () => {
    // Mock existsSync to return true
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // Setup mock data
    const existingIndex = [
      { 
        path: 'file1.ts', 
        type: 'node', 
        exports: ['Class1'], 
        dependencies: [], 
        usedIn: [], 
        description: 'Description 1',
        lastUpdated: '2023-01-01T00:00:00.000Z'
      }
    ];

    // Setup mocks
    mockGlobFn.mockResolvedValueOnce(['file1.ts']);

    (fs.readFileSync as jest.Mock).mockImplementation((path: unknown) => {
      if (typeof path === 'string' && path.includes('codebase-index.json')) {
        return JSON.stringify(existingIndex);
      }
      return '';
    });

    // Mock the process exit
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`Process exit with code ${code}`);
    });

    // Run with check flag - should exit with code 1
    await expect(execAsync('ts-node scripts/gen-codebase-index.ts --check'))
      .rejects.toThrow('Process exit with code 1');

    mockExit.mockRestore();
  });
});
