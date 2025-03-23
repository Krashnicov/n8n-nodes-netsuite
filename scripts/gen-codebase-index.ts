import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import glob from 'fast-glob';
import { randomUUID } from 'crypto';

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
  lastUpdated: string;
  confidence: number;
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
  indexBuildId: string;
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
  
  // Test files
  if (filePath.includes('/__tests__/') || filePath.endsWith('.test.ts') || filePath.endsWith('.test.js')) return 'test';
  
  // Config files
  if (filePath.endsWith('.config.js') || 
      filePath.includes('.eslintrc') || 
      filePath.endsWith('tsconfig.json') || 
      filePath.endsWith('package.json')) return 'config';
  
  // Script files (new)
  if (filePath.startsWith('scripts/') && (filePath.endsWith('.ts') || filePath.endsWith('.js'))) return 'script';
  
  // Default fallback
  return 'other';
};

// Calculate confidence score based on file path and type
const calculateConfidence = (filePath: string, fileType: string): number => {
  // Direct path-based match: 1.0
  if (
    filePath.endsWith('.node.ts') ||
    filePath.endsWith('.node.json') ||
    filePath.endsWith('.node.options.ts') ||
    filePath.endsWith('.node.types.ts') ||
    filePath.endsWith('.credentials.ts')
  ) {
    return 1.0;
  }
  
  // Content-based inference: 0.8
  if (
    filePath.includes('/__tests__/') ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.js') ||
    (filePath.startsWith('scripts/') && (filePath.endsWith('.ts') || filePath.endsWith('.js')))
  ) {
    return 0.8;
  }
  
  // Fallback based on extension hints: 0.5
  if (
    filePath.endsWith('.ts') ||
    filePath.endsWith('.js') ||
    filePath.endsWith('.json') ||
    filePath.endsWith('.md')
  ) {
    return 0.5;
  }
  
  // Unknown/default: 0.3
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

// Extract description from file contents
const extractDescription = (filePath: string): string => {
  try {
    const ext = path.extname(filePath);
    const src = fs.readFileSync(filePath, 'utf-8');
    
    // For TypeScript files, try to extract from JSDoc comments first
    if (['.ts', '.js', '.json'].includes(ext)) {
      const sourceFile = ts.createSourceFile(filePath, src, ts.ScriptTarget.ES2015, true);
      
      // Try to find top-of-file block comment
      const fileComment = ts.getLeadingCommentRanges(sourceFile.text, 0);
      if (fileComment && fileComment.length > 0) {
        const comment = sourceFile.text.substring(fileComment[0].pos, fileComment[0].end);
        // Clean up comment markers and get the first meaningful line/paragraph
        const cleanComment = comment
          .replace(/\/\*\*|\*\/|\*\s?|\/\/\s?/g, '') // Remove comment symbols
          .trim()
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join(' ')
          .trim();
          
        if (cleanComment.length > 0) {
          // Get first sentence or truncate to 140 chars
          return truncateDescription(cleanComment);
        }
      }
      
      // Look for class/interface/function descriptions via JSDoc
      let description = '';
      sourceFile.forEachChild((node) => {
        if (!description && 
            (ts.isClassDeclaration(node) || 
             ts.isInterfaceDeclaration(node) || 
             ts.isFunctionDeclaration(node)) && 
            node.name) {
          const nodeComment = ts.getLeadingCommentRanges(sourceFile.text, node.pos);
          if (nodeComment && nodeComment.length > 0) {
            description = sourceFile.text
              .substring(nodeComment[0].pos, nodeComment[0].end)
              .replace(/\/\*\*|\*\/|\*\s?|\/\/\s?/g, '') // Remove comment symbols
              .trim()
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join(' ')
              .trim();
          }
        }
      });
      
      if (description) return truncateDescription(description);
      
      // Fallback for TS/JS: First meaningful code line
      const lines = src.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('import') && !trimmedLine.startsWith('//')) {
          return truncateDescription(trimmedLine);
        }
      }
    }
    
    // For JSON files, look for description field
    if (ext === '.json') {
      try {
        const json = JSON.parse(src);
        if (json.description) return truncateDescription(json.description);
        if (json.node && json.codexVersion) return truncateDescription(`Node definition for ${json.node}`);
      } catch (e) {
        // Invalid JSON, continue with fallback
      }
    }
    
    // For markdown files, use first heading or paragraph
    if (ext === '.md') {
      const lines = src.split('\n');
      // First heading (any level: #, ##, etc)
      const headingMatch = lines.find(line => /^#+\s/.test(line));
      if (headingMatch) return truncateDescription(headingMatch.replace(/^#+\s/, ''));
      
      // First non-empty paragraph (up to first sentence)
      let paragraph = '';
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() && !lines[i].startsWith('#')) {
          paragraph += ' ' + lines[i].trim();
        } else if (paragraph) {
          // End of paragraph
          return truncateDescription(paragraph);
        }
      }
      if (paragraph) return truncateDescription(paragraph);
    }
    
    // Fallback: Infer from file name and type
    const fileName = path.basename(filePath);
    const fileType = inferType(filePath);
    
    if (fileType === 'node') return `Main node logic for ${fileName.split('.')[0]} integration`;
    if (fileType === 'credential') return `Credential definition for ${fileName.split('.')[0]}`;
    if (fileType === 'node-options') return `UI configuration for ${fileName.split('.')[0]} node`;
    if (fileType === 'node-types') return `Type definitions for ${fileName.split('.')[0]} node`;
    if (fileType === 'test') return `Tests for ${fileName.split('.test')[0]}`;
    if (fileType === 'script') return `Script for ${fileName.split('.')[0]}`;
    
    return `File ${fileName}`;
  } catch (error) {
    console.error(`Error extracting description from ${filePath}:`, error);
    return `File ${path.basename(filePath)}`;
  }
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
        resolvedDep = path.relative(process.cwd(), resolvedPath).replace(/\\/g, '/');
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
      const type = inferType(file);
      
      let exports: string[] = [];
      let dependencies: string[] = [];
      
      if (['.ts', '.js'].includes(ext)) {
        exports = extractExports(abs);
        dependencies = extractDependencies(abs);
        // Normalize and dedupe dependencies
        dependencies = normalizeDependencies(dependencies, abs);
      }
      
      const description = extractDescription(abs);
      
      const confidence = calculateConfidence(file, type);
      
      fileMap.set(file, {
        path: file,
        type,
        exports,
        dependencies,
        usedIn: [], // Will populate in second pass
        description,
        lastUpdated: now,
        confidence,
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
    
    // Second pass: populate usedIn arrays by cross-referencing dependencies
    const entries = Array.from(fileMap.values());
    
    // Create a map for faster lookups
    const pathToEntryMap = new Map();
    for (const entry of entries) {
      pathToEntryMap.set(entry.path, entry);
    }
    
    // Debug: Print all entries and their paths
    console.log('[codebase-index] Total entries:', entries.length);
    
    for (const entry of entries) {
      for (const dependency of entry.dependencies) {
        // Skip external dependencies (those not in our codebase)
        if (!dependency.includes('/')) continue;
        
        // Debug: Print dependency lookup
        console.log(`[codebase-index] Looking for dependency: ${dependency} from ${entry.path}`);
        
        // Find the entry that matches this dependency path
        const dependencyEntry = pathToEntryMap.get(dependency);
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
          dependencies: [...rest.dependencies].sort(),
          usedIn: [...rest.usedIn].sort()
        }))
        .sort((a, b) => a.path.localeCompare(b.path));
      
      const currentNormalized = normalizeForComparison(index);
      const existingNormalized = normalizeForComparison(existingEntries);
      
      if (JSON.stringify(currentNormalized) !== JSON.stringify(existingNormalized)) {
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

    // Create the final structured output
    const finalOutput: CodebaseIndex = {
      indexVersion: "1.3.0",
      generatedAt: new Date().toISOString(),
      repoName,
      repoPath,
      generatedBy: "codebase-index@1.3.0",
      ciRunId,
      mode,
      indexBuildId: randomUUID(),
      entries: sortedIndex
    };

    fs.writeFileSync(INDEX_PATH, JSON.stringify(finalOutput, null, 2));
    console.log(`[codebase-index] Wrote ${index.length} entries to ${INDEX_PATH}`);
  } catch (error) {
    console.error('[codebase-index] Error:', error);
    process.exit(1);
  }
})();
