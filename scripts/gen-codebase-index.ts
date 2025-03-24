import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import glob from 'fast-glob';
import crypto from 'crypto';
import { execSync } from 'child_process';

// Constants
const INDEX_PATH = path.resolve('docs/codebase-index.json');
const IGNORE = ['node_modules/**', 'dist/**', 'tmp/**', 'cache/**', '.git/**', '.DS_Store', 'coverage/**', 'pnpm-lock.yaml'];

// Index entry type definition
interface IndexEntry {
  path: string;
  type: string;
  exports: string[];
  dependencies: string[];
  usedIn: string[];
  description: string;
  confidence: number; // Add confidence score field
  lastUpdated: string;
  fileSize?: number;      // New: File size in bytes
  linesOfCode?: number;   // New: Number of lines of code
  checksum?: string;      // New: SHA-256 hash of file content
  language?: string;      // New: Language tag (TS, JS, MD, JSON, etc.)
  env?: EnvVariable[];    // New: Array of environment variables
}

// Environment variable definition
interface EnvVariable {
  name: string;           // Name of the environment variable
  description: string;    // Description of what it's used for
  defaultValue?: string;  // Default value, if any
  context: string;        // Usage context (e.g., "authentication", "debugging")
}

// Output structure with top-level summary
interface CodebaseIndex {
  indexVersion: string;
  generatedAt: string;
  repoName: string;
  repoPath: string;
  generatedBy: string;
  ciRunId: string;
  mode: string;
  sourceBranch: string; // New field for tracking source branch
  indexBuildId?: string; // Optional UUID for v4+ preparation
  entries: IndexEntry[];
}

// File type inference based on path and content
const inferType = (filePath: string): string => {
  // Node-related files
  if (filePath.endsWith('.node.ts')) return 'node';
  if (filePath.endsWith('.node.json')) return 'codex';
  if (filePath.endsWith('.node.options.ts')) return 'node-options';
  if (filePath.endsWith('.node.types.ts')) return 'node-types';
  
  // Credentials
  if (filePath.endsWith('.credentials.ts')) return 'credential';
  
  // Scripts files - new condition
  if (filePath.startsWith('scripts/') && (filePath.endsWith('.ts') || filePath.endsWith('.js'))) return 'script';
  
  // Test files
  if (filePath.includes('/__tests__/') || filePath.endsWith('.test.ts') || filePath.endsWith('.test.js')) return 'test';
  
  // Config files
  if (filePath.endsWith('.config.js') || 
      filePath.includes('.eslintrc') || 
      filePath.endsWith('tsconfig.json') || 
      filePath.endsWith('package.json')) return 'config';
  
  // Default fallback
  return 'other';
};
// Calculate confidence score for an entry
const calculateConfidence = (filePath: string, type: string): number => {
  // Direct path rule matches (highest confidence)
  if (
    filePath.endsWith('.node.ts') ||
    filePath.endsWith('.node.json') ||
    filePath.endsWith('.node.options.ts') ||
    filePath.endsWith('.node.types.ts') ||
    filePath.endsWith('.credentials.ts')
  ) {
    return 1.0; // Direct path rule (e.g. *.node.ts)
  }
  
  // Content-based matches
  if (
    type === 'script' ||
    filePath.includes('/__tests__/') ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.js')
  ) {
    return 0.8; // Content-based match (e.g. AST or regex)
  }
  
  // Fallback with extension hints
  if (filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.json')) {
    return 0.5; // Fallback with extension hints
  }
  
  // Unknown / default
  return 0.3;
};


// Extract exports from TypeScript files
const extractExports = (filePath: string): string[] => {
  try {
    const src = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, src, ts.ScriptTarget.ES2015, true);
    const exports: string[] = [];
    
    sourceFile.forEachChild((node) => {
      if (ts.isClassDeclaration(node) && node.name && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push(node.name.text);
      } else if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        node.declarationList.declarations.forEach(decl => {
          if (decl.name && ts.isIdentifier(decl.name)) {
            exports.push(decl.name.text);
          }
        });
      } else if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push(node.name.text);
      } else if (ts.isInterfaceDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push(node.name.text);
      } else if (ts.isEnumDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push(node.name.text);
      } else if (ts.isTypeAliasDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push(node.name.text);
      }
    });
    
    return exports;
  } catch (error) {
    console.error(`Error extracting exports from ${filePath}:`, error);
    return [];
  }
};

// Extract dependencies (imports) from TypeScript files
const extractDependencies = (filePath: string): string[] => {
  try {
    const src = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, src, ts.ScriptTarget.ES2015, true);
    const dependencies: string[] = [];
    
    sourceFile.forEachChild((node) => {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        dependencies.push(node.moduleSpecifier.text);
      }
    });
    
    return dependencies;
  } catch (error) {
    console.error(`Error extracting dependencies from ${filePath}:`, error);
    return [];
  }
};

// Constants for description handling
const MIN_DESCRIPTION_LENGTH = 10;
const DEFAULT_DESCRIPTION = 'No description available';

// Helper function to check if a description is valid
const isDescriptionValid = (description: string): boolean => {
  if (!description) return false;
  if (description.length < MIN_DESCRIPTION_LENGTH) return false;
  if (description === '{' || description === '}') return false;
  if (description.match(/^[{}();,\[\]]+$/)) return false;
  return true;
};

// Helper function to truncate description to first sentence or 140 chars
const truncateDescription = (text: string): string => {
  // Remove any extra whitespace
  const trimmed = text.trim().replace(/\s+/g, ' ');
  
  // Try to get first sentence (ending with period, question mark, or exclamation)
  const sentenceMatch = trimmed.match(/^(.*?[.!?])\s/);
  if (sentenceMatch && sentenceMatch[1].length <= 140) {
    return sentenceMatch[1];
  }
  
  // If no sentence found or it's too long, truncate to 140 chars
  return trimmed.length <= 140 ? trimmed : trimmed.substring(0, 137) + '...';
};

// Extract description from file contents
const extractDescription = (filePath: string): string => {
  try {
    const ext = path.extname(filePath);
    const src = fs.readFileSync(filePath, 'utf-8');
    let description = '';
    
    // For TypeScript files, try to extract from JSDoc comments first
    if (['.ts', '.js', '.json'].includes(ext)) {
      const sourceFile = ts.createSourceFile(filePath, src, ts.ScriptTarget.ES2015, true);
      
      // Try to find top-of-file block comment
      const fileComment = ts.getLeadingCommentRanges(sourceFile.text, 0);
      if (fileComment && fileComment.length > 0) {
        const comment = sourceFile.text.substring(fileComment[0].pos, fileComment[0].end);
        // Clean up comment markers and get the first meaningful line/paragraph
        const cleanComment = comment
          .replace(/\/\*\*|\*\/|\*\s?|\/\/\s?/g, '') // Remove comment markers
          .trim()
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join(' ')
          .trim();
          
        if (cleanComment.length > 0) {
          description = cleanComment;
        }
      }
      
      // If no description found from file comment, try class/interface/function descriptions
      if (!isDescriptionValid(description)) {
        // Look for class/interface/function descriptions via JSDoc
        sourceFile.forEachChild((node) => {
          if (!isDescriptionValid(description) && 
              (ts.isClassDeclaration(node) || 
               ts.isInterfaceDeclaration(node) || 
               ts.isFunctionDeclaration(node)) && 
              node.name) {
            const nodeComment = ts.getLeadingCommentRanges(sourceFile.text, node.pos);
            if (nodeComment && nodeComment.length > 0) {
              const commentText = sourceFile.text
                .substring(nodeComment[0].pos, nodeComment[0].end)
                .replace(/\/\*\*|\*\/|\*\s?|\/\/\s?/g, '')
                .trim()
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .join(' ')
                .trim();
                
              if (isDescriptionValid(commentText)) {
                description = commentText;
              }
            }
          }
        });
      }
      
      // Fallback: First meaningful code line that's not an import or comment
      if (!isDescriptionValid(description)) {
        const lines = src.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine && 
              !trimmedLine.startsWith('import') && 
              !trimmedLine.startsWith('//') &&
              trimmedLine !== '{' &&
              !trimmedLine.match(/^[{}();,]+$/)) {
            description = trimmedLine;
            break;
          }
        }
      }
    }
    
    // For JSON files, look for description field
    if (!isDescriptionValid(description) && ext === '.json') {
      try {
        const json = JSON.parse(src);
        if (json.description && isDescriptionValid(json.description)) {
          description = json.description;
        } else if (json.name) {
          description = `Configuration for ${json.name}`;
        } else if (json.node && json.codexVersion) {
          description = `Node definition for ${json.node}`;
        }
      } catch (e) {
        // Invalid JSON, continue with fallback
      }
    }
    
    // For markdown files, use first heading or paragraph
    if (!isDescriptionValid(description) && ext === '.md') {
      const lines = src.split('\n');
      // First heading (any level: #, ##, etc)
      const headingMatch = lines.find(line => /^#+\s/.test(line));
      if (headingMatch) {
        description = headingMatch.replace(/^#+\s/, '');
      } else {
        // First non-empty paragraph
        let paragraph = '';
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() && !lines[i].startsWith('#')) {
            paragraph += ' ' + lines[i].trim();
          } else if (paragraph) {
            // End of paragraph
            description = paragraph.trim();
            break;
          }
        }
        if (paragraph && !description) {
          description = paragraph.trim();
        }
      }
    }
    
    // Final fallback: Infer from file name and type
    if (!isDescriptionValid(description)) {
      const fileName = path.basename(filePath);
      const fileType = inferType(filePath);
      
      if (fileType === 'node') description = `Main node logic for ${fileName.split('.')[0]} integration`;
      else if (fileType === 'credential') description = `Credential definition for ${fileName.split('.')[0]}`;
      else if (fileType === 'node-options') description = `UI configuration for ${fileName.split('.')[0]} node`;
      else if (fileType === 'node-types') description = `Type definitions for ${fileName.split('.')[0]} node`;
      else if (fileType === 'test') description = `Tests for ${fileName.split('.test')[0]}`;
      else if (fileType === 'script') description = `Script for ${fileName.split('.')[0]}`;
      else description = `File ${fileName}`;
    }
    
    // If still no valid description, use default
    if (!isDescriptionValid(description)) {
      description = DEFAULT_DESCRIPTION;
    }
    
    // Truncate description to first sentence or 140 chars max
    return truncateDescription(description);
  } catch (error) {
    console.error(`Error extracting description from ${filePath}:`, error);
    return `File ${path.basename(filePath)}`;
  }
};

// Resolve relative imports to actual file paths
const resolveRelativePath = (importPath: string, currentFilePath: string): string | null => {
  if (importPath.startsWith('.')) {
    const currentDir = path.dirname(currentFilePath);
    let resolvedPath = path.resolve(currentDir, importPath);
    
    // Try common extensions if no extension in import
    if (!path.extname(resolvedPath)) {
      for (const ext of ['.ts', '.js', '.json']) {
        if (fs.existsSync(`${resolvedPath}${ext}`)) {
          return `${resolvedPath}${ext}`;
        }
      }
      
      // Try as a directory with index file
      for (const ext of ['.ts', '.js', '.json']) {
        if (fs.existsSync(path.join(resolvedPath, `index${ext}`))) {
          return path.join(resolvedPath, `index${ext}`);
        }
      }
    }
    
    return resolvedPath;
  }
  
  return null; // External package
};

// Calculate file size in bytes
const calculateFileSize = (filePath: string): number => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error calculating file size for ${filePath}:`, error);
    return 0;
  }
};

// Calculate lines of code
const calculateLinesOfCode = (content: string): number => {
  return content.split('\n').filter(line => line.trim().length > 0).length;
};

// Calculate file checksum (SHA-256)
const calculateChecksum = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

// Determine file language from extension
const determineLanguage = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    '.ts': 'TS',
    '.js': 'JS',
    '.json': 'JSON',
    '.md': 'MD',
    '.svg': 'SVG',
    '.css': 'CSS',
    '.html': 'HTML'
  };
  return languageMap[ext] || 'Unknown';
};

// Extract environment variables from TypeScript/JavaScript files
const extractEnvironmentVariables = (filePath: string): EnvVariable[] => {
  try {
    const src = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath);
    
    // Only process JS/TS files
    if (!['.ts', '.js'].includes(ext)) {
      return [];
    }
    
    const sourceFile = ts.createSourceFile(filePath, src, ts.ScriptTarget.ES2015, true);
    
    // Create a map to avoid duplicates
    const envVarMap = new Map<string, EnvVariable>();
    
    // Visit each node in the AST
    const visit = (node: ts.Node) => {
      // Look for property access expressions like process.env.VAR_NAME
      if (ts.isPropertyAccessExpression(node) && 
          node.expression && 
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.expression && 
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'process' &&
          node.expression.name.text === 'env') {
        
        const varName = node.name.text;
        
        // Skip if we already found this var in this file
        if (envVarMap.has(varName)) return;
        
        // Try to determine context and default value
        let context = 'unknown';
        let defaultValue: string | undefined = undefined;
        let description = `Environment variable ${varName}`;
        
        // Check parent nodes for default values
        let currentNode: ts.Node = node;
        let parent = currentNode.parent;
        
        // Look for patterns like process.env.VAR || 'default'
        if (parent && ts.isBinaryExpression(parent) && 
            parent.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
          if (ts.isStringLiteral(parent.right) || ts.isNoSubstitutionTemplateLiteral(parent.right)) {
            defaultValue = parent.right.getText().replace(/['"`]/g, '');
          }
        }
        
        // Determine context based on variable name and surrounding code
        if (varName.toLowerCase().includes('key') || 
            varName.toLowerCase().includes('secret') || 
            varName.toLowerCase().includes('token') ||
            varName.toLowerCase().includes('id')) {
          context = 'authentication';
        } else if (varName === 'DEBUG') {
          context = 'debugging';
        } else if (varName.toLowerCase().includes('path') || 
                   varName.toLowerCase().includes('dir') ||
                   varName.toLowerCase().includes('file')) {
          context = 'file-system';
        } else if (varName.toLowerCase().includes('host') || 
                   varName.toLowerCase().includes('url') || 
                   varName.toLowerCase().includes('domain')) {
          context = 'networking';
        }
        
        // Look for comments above the usage that might describe the variable
        const lineAndCharacter = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const line = lineAndCharacter.line;
        
        // Check for comments in the lines above
        const sourceLines = src.split('\n');
        let commentLine = line - 1;
        let commentText = '';
        
        // Look for comments up to 3 lines above
        while (commentLine >= 0 && commentLine > line - 4) {
          const currentLine = sourceLines[commentLine].trim();
          if (currentLine.startsWith('//')) {
            // Found a comment line
            const comment = currentLine.substring(2).trim();
            if (comment && !comment.startsWith('eslint-')) {
              commentText = comment;
              break;
            }
          } else if (!currentLine.startsWith('const') && !currentLine.startsWith('let') && 
                     !currentLine.startsWith('var') && currentLine !== '') {
            // Stop if we hit non-empty, non-comment, non-variable declaration line
            break;
          }
          commentLine--;
        }
        
        if (commentText) {
          description = commentText;
        }
        
        // Add to map
        envVarMap.set(varName, {
          name: varName,
          description: description,
          defaultValue: defaultValue,
          context: context
        });
      }
      
      // Continue traversing the AST
      ts.forEachChild(node, visit);
    };
    
    // Start traversing the AST
    visit(sourceFile);
    
    // Convert map to array
    return Array.from(envVarMap.values());
  } catch (error) {
    console.error(`Error extracting environment variables from ${filePath}:`, error);
    return [];
  }
};

// Normalize dependencies to remove duplicates and standardize paths
const normalizeDependencies = (dependencies: string[], currentFilePath: string): string[] => {
  const normalizedDeps: string[] = [];
  const depSet = new Set<string>();
  
  for (const dep of dependencies) {
    // Skip empty dependencies
    if (!dep.trim()) continue;
    
    // Try to resolve relative paths
    let resolvedDep = dep;
    if (dep.startsWith('.')) {
      const resolvedPath = resolveRelativePath(dep, currentFilePath);
      if (resolvedPath) {
        // Convert to relative path from repo root
        resolvedDep = path.relative(process.cwd(), resolvedPath).replace(/\\/g, '/');
        
        // Also add version without extension for better matching
        const withoutExt = resolvedDep.replace(/\.(ts|js|json|md)$/, '');
        if (withoutExt !== resolvedDep) {
          depSet.add(withoutExt);
          normalizedDeps.push(withoutExt);
        }
      }
    }
    
    // For non-relative paths, also add version without extension
    if (!dep.startsWith('.') && dep.includes('/')) {
      const withoutExt = dep.replace(/\.(ts|js|json|md)$/, '');
      if (withoutExt !== dep && !depSet.has(withoutExt)) {
        depSet.add(withoutExt);
        normalizedDeps.push(withoutExt);
      }
    }
    
    // Add to set to deduplicate
    if (!depSet.has(resolvedDep)) {
      depSet.add(resolvedDep);
      normalizedDeps.push(resolvedDep);
    }
  }
  
  return normalizedDeps.sort(); // Sort for consistent output
};

// Main function
(async () => {
  try {
    // Find all matching files
    const files = await glob(['**/*.{ts,js,json,md}'], { 
      ignore: IGNORE,
      dot: true,
      absolute: false
    });
    
    // First pass: Create index entries with basic metadata
    const fileMap = new Map<string, IndexEntry>();
    const now = new Date().toISOString();
    
    for (const file of files) {
      const abs = path.resolve(file);
      const ext = path.extname(file);
      
      // Read file content once for multiple uses
      const fileContent = fs.readFileSync(abs, 'utf-8');
      
      let exports: string[] = [];
      let dependencies: string[] = [];
      let envVariables: EnvVariable[] = [];
      
      if (['.ts', '.js'].includes(ext)) {
        exports = extractExports(abs);
        dependencies = extractDependencies(abs);
        // Normalize and dedupe dependencies
        dependencies = normalizeDependencies(dependencies, abs);
        
        // Extract environment variables
        envVariables = extractEnvironmentVariables(abs);
      }
      
      const description = extractDescription(abs);
      const fileType = inferType(file);
      const confidence = calculateConfidence(file, fileType);
      const fileSize = calculateFileSize(abs);
      const linesOfCode = calculateLinesOfCode(fileContent);
      const checksum = calculateChecksum(fileContent);
      const language = determineLanguage(file);
      
      fileMap.set(file, {
        path: file,
        type: fileType,
        exports,
        dependencies,
        usedIn: [], // Will populate in second pass
        description,
        confidence,
        lastUpdated: now,
        fileSize,
        linesOfCode,
        checksum,
        language,
        env: envVariables.length > 0 ? envVariables : undefined
      });
    }
    
    // Second pass: Populate usedIn field by analyzing dependencies
    for (const [filePath, entry] of fileMap.entries()) {
      for (const dep of entry.dependencies) {
        const resolvedPath = resolveRelativePath(dep, filePath);
        if (resolvedPath) {
          // Convert absolute path to relative (matching our index keys)
          const relativePath = path.relative(process.cwd(), resolvedPath).replace(/\\/g, '/');
          
          if (fileMap.has(relativePath)) {
            // Add this file to the usedIn array of the dependency
            const depEntry = fileMap.get(relativePath);
            if (depEntry && !depEntry.usedIn.includes(filePath)) {
              depEntry.usedIn.push(filePath);
            }
          }
        }
      }
    }
    
    // Convert map to array for output and sort for consistency across environments
    const index = Array.from(fileMap.values()).sort((a, b) => a.path.localeCompare(b.path));
    
    // Parse command line arguments
    const checkMode = process.argv.includes('--check');
    
    // Get CI run ID from command line or default
    const ciRunIdArg = process.argv.find(arg => arg.startsWith('--ci-run-id='));
    const ciRunId = ciRunIdArg 
      ? ciRunIdArg.split('=')[1] 
      : process.env.CI_COMMIT_SHA || process.env.BUILD_ID || 'manual';
    
    // Get mode from command line or default
    const modeArg = process.argv.find(arg => arg.startsWith('--mode='));
    const mode = modeArg 
      ? modeArg.split('=')[1] 
      : (process.env.CI ? 'ci' : 'manual');
    
    // Get source branch from command line, environment variable, or default
    const sourceBranchArg = process.argv.find(arg => arg.startsWith('--source-branch='));
    let sourceBranch = sourceBranchArg 
      ? sourceBranchArg.split('=')[1] 
      : (process.env.CI_BRANCH || process.env.BRANCH_NAME);
    
    // If no branch specified from args or env, try to get from git command
    if (!sourceBranch) {
      try {
        const branchBuffer = execSync('git branch --show-current', { encoding: 'utf8' });
        sourceBranch = branchBuffer.toString().trim();
      } catch (err) {
        console.warn('[codebase-index] Warning: Could not get current branch from git:', err);
        sourceBranch = 'main'; // Default to main if git command fails
      }
    }
    
    // Use main as fallback if all else fails
    if (!sourceBranch) {
      sourceBranch = 'main';
    }
    
    // Second pass: populate usedIn arrays by cross-referencing dependencies
    const entries = Array.from(fileMap.values());
    
    // Create a map for faster lookups with multiple normalized versions
    const pathToEntryMap = new Map();
    for (const entry of entries) {
      // Primary path
      pathToEntryMap.set(entry.path, entry);
      
      // Without extension for better matching
      const withoutExt = entry.path.replace(/\.(ts|js|json|md)$/, '');
      if (withoutExt !== entry.path) {
        pathToEntryMap.set(withoutExt, entry);
      }
      
      // Basename for better matching with relative imports
      const basename = path.basename(entry.path);
      pathToEntryMap.set(basename, entry);
      
      // Basename without extension
      const basenameWithoutExt = path.basename(entry.path).replace(/\.(ts|js|json|md)$/, '');
      if (basenameWithoutExt !== basename) {
        pathToEntryMap.set(basenameWithoutExt, entry);
      }
    }
    
    // Debug: Print all entries and their paths
    console.log('[codebase-index] Total entries:', entries.length);
    
    for (const entry of entries) {
      for (const dependency of entry.dependencies) {
        // Skip external dependencies (those not in our codebase)
        if (!dependency.includes('/') && !dependency.startsWith('.')) {
          console.log(`[codebase-index] Skipping external dependency: ${dependency}`);
          continue;
        }
        
        // Try different variations of the dependency path
        const normalizedDep = dependency.replace(/\.(ts|js|json|md)$/, '');
        const baseDep = path.basename(dependency);
        const baseDepNoExt = path.basename(dependency).replace(/\.(ts|js|json|md)$/, '');
        
        // Debug: Print dependency lookup
        console.log(`[codebase-index] Looking for dependency: ${dependency} from ${entry.path}`);
        
        // Try all variations to find a match
        let dependencyEntry = pathToEntryMap.get(dependency) || 
                             pathToEntryMap.get(normalizedDep) || 
                             pathToEntryMap.get(baseDep) ||
                             pathToEntryMap.get(baseDepNoExt);
        
        if (dependencyEntry) {
          // Add this entry's path to the dependency's usedIn array if not already there
          if (!dependencyEntry.usedIn.includes(entry.path)) {
            dependencyEntry.usedIn.push(entry.path);
            console.log(`[codebase-index] Added ${entry.path} to usedIn for ${dependency}`);
          }
        } else {
          console.log(`[codebase-index] Dependency not found: ${dependency}`);
        }
      }
    }
      
    if (checkMode) {
      if (!fs.existsSync(INDEX_PATH)) {
        console.error('[codebase-index] Index file not found. Run the tool to generate it.');
        process.exit(1);
      }
      
      const existing = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
      
      // Extract entries array from the existing index (if it's the new format)
      const existingEntries = existing.entries || existing;
      
      // Compare without timestamps to avoid false positives
      const normalizeForComparison = (entries: IndexEntry[]) => 
        entries.map(({lastUpdated, ...rest}) => ({
          ...rest,
          // Sort arrays for consistent comparison
          exports: [...rest.exports].sort(),
          // Filter out external dependencies for comparison
          dependencies: [...rest.dependencies]
            .filter(dep => dep.includes('/') || dep.startsWith('.'))
            .sort(),
          usedIn: [...rest.usedIn].sort()
        }))
        .sort((a, b) => a.path.localeCompare(b.path));
      
      const currentNormalized = normalizeForComparison(index);
      const existingNormalized = normalizeForComparison(existingEntries);
      
      // For comparison, we need to normalize the entries by removing timestamps and UUIDs
      const normalizeForDeepComparison = (entries: any[]) => {
        return entries.map(entry => {
          // Create a new object without the timestamp and with filtered dependencies
          const { lastUpdated, checksum, indexBuildId, confidence, fileSize, linesOfCode, language, ...rest } = entry;
          return {
            ...rest,
            // Filter out external dependencies for comparison
            dependencies: (rest.dependencies || []).filter((dep: string) => dep.includes('/') || dep.startsWith('.'))
          };
        });
      };
      
      // Only compare the entries, not the top-level metadata
      const existingNormalizedForComparison = normalizeForDeepComparison(existingNormalized);
      const currentNormalizedForComparison = normalizeForDeepComparison(currentNormalized);
      
      // Sort both arrays by path for consistent comparison
      const sortByPath = (a: any, b: any) => a.path.localeCompare(b.path);
      const sortedExisting = existingNormalizedForComparison.sort(sortByPath);
      const sortedCurrent = currentNormalizedForComparison.sort(sortByPath);
      
      // Compare only the essential fields for determining if index is out of date
      const simplifyForComparison = (entry: any) => ({
        path: entry.path,
        type: entry.type,
        exports: entry.exports,
        dependencies: entry.dependencies
      });
      
      const simplifiedExisting = sortedExisting.map(simplifyForComparison);
      const simplifiedCurrent = sortedCurrent.map(simplifyForComparison);
      
      if (JSON.stringify(simplifiedCurrent) !== JSON.stringify(simplifiedExisting)) {
        console.error('[codebase-index] Index is out of date. Run the tool to regenerate.');
        process.exit(1);
      } else {
        console.log('[codebase-index] Index is up to date.');
        process.exit(0);
      }
    }
    
    // Write output with top-level summary structure
    const sortedIndex = index.map(entry => ({
      ...entry,
      exports: [...entry.exports].sort(),
      dependencies: [...entry.dependencies].sort(),
      usedIn: [...entry.usedIn].sort()
    }));

    // Get repository info
    const repoName = path.basename(process.cwd());
    const repoPath = process.cwd();
    
    // Generate UUID for indexBuildId
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Create the final structured output
    const finalOutput: CodebaseIndex = {
      indexVersion: "1.4.0", // Updated to reflect addition of environment variables
      generatedAt: new Date().toISOString(),
      repoName,
      repoPath,
      generatedBy: "codebase-index@1.4.0", // Updated to match indexVersion
      ciRunId,
      mode,
      sourceBranch, // Add the source branch to the header
      indexBuildId: generateUUID(), // Add UUID for indexBuildId
      entries: sortedIndex
    };

    fs.writeFileSync(INDEX_PATH, JSON.stringify(finalOutput, null, 2));
    console.log(`[codebase-index] Wrote ${index.length} entries to ${INDEX_PATH}`);
  } catch (error) {
    console.error('[codebase-index] Error:', error);
    process.exit(1);
  }
})();
