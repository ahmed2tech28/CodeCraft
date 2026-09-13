import { workspaceService } from '../services/workspace.service.js';
import { templateService } from '../services/template.service.js';
import fs from 'fs-extra';
import path from 'node:path';

async function runWorkspaceTests() {
  console.log('🧪 Starting Workspace & Template Service Tests...');

  const testProjectId = 'test-proj-' + Date.now();
  const testWorkspacePath = workspaceService.getWorkspacePath(testProjectId);

  try {
    // 1. Test Template Existence
    const templatePath = templateService.getTemplatePath('nextjs');
    const templateExists = await fs.pathExists(templatePath);
    if (!templateExists) {
      throw new Error(`Template directory not found at ${templatePath}`);
    }
    console.log('  ✓ Starter template directory verified at templates/nextjs');

    // 2. Test Project Workspace Initialization
    await workspaceService.initProjectWorkspace(testProjectId, 'nextjs');
    const projectDirExists = await fs.pathExists(testWorkspacePath);
    const packageJsonExists = await fs.pathExists(path.join(testWorkspacePath, 'package.json'));
    if (!projectDirExists || !packageJsonExists) {
      throw new Error('Project initialization failed to copy template files');
    }
    console.log('  ✓ Project workspace created & template files copied');

    // 3. Test File Tree Generation
    const fileTree = await workspaceService.getFileTree(testProjectId);
    if (!Array.isArray(fileTree) || fileTree.length === 0) {
      throw new Error('File tree is empty or invalid');
    }
    const hasSrc = fileTree.some((node) => node.name === 'src' && node.isDirectory);
    const hasPackageJson = fileTree.some((node) => node.name === 'package.json' && !node.isDirectory);
    if (!hasSrc || !hasPackageJson) {
      throw new Error('File tree does not contain expected template structure');
    }
    console.log('  ✓ File tree generation accurately indexes workspace files & directories');

    // 4. Test Reading Files
    const packageJsonContent = await workspaceService.readFile(testProjectId, 'package.json');
    const parsedPkg = JSON.parse(packageJsonContent);
    if (!parsedPkg.name) {
      throw new Error('Failed to read valid package.json content');
    }
    console.log('  ✓ File reading works correctly');

    // 5. Test Writing Files
    const newComponentPath = 'src/components/TestWidget.tsx';
    const componentCode = 'export const TestWidget = () => <div>Widget</div>;';
    await workspaceService.writeFile(testProjectId, newComponentPath, componentCode);

    const readBackCode = await workspaceService.readFile(testProjectId, newComponentPath);
    if (readBackCode !== componentCode) {
      throw new Error('File write verification mismatch');
    }
    console.log('  ✓ File writing (with auto-directory creation) verified');

    // 6. Test Deleting Files
    await workspaceService.deleteFile(testProjectId, newComponentPath);
    const stillExists = await workspaceService.fileExists(testProjectId, newComponentPath);
    if (stillExists) {
      throw new Error('File deletion failed');
    }
    console.log('  ✓ File deletion verified');

    // 7. Test Security: Directory Traversal Prevention
    let traversalBlocked = false;
    try {
      workspaceService.resolveSafePath(testProjectId, '../../package.json');
    } catch {
      traversalBlocked = true;
    }
    if (!traversalBlocked) {
      throw new Error('Path traversal attack was NOT blocked!');
    }

    let absoluteEscapeBlocked = false;
    try {
      workspaceService.resolveSafePath(testProjectId, '/etc/passwd');
    } catch {
      absoluteEscapeBlocked = true;
    }
    if (!absoluteEscapeBlocked) {
      throw new Error('Absolute path escape was NOT blocked!');
    }
    console.log('  ✓ Path traversal security safeguards successfully block escape attempts');

    console.log('🎉 ALL WORKSPACE TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Cleanup test workspace
    if (await fs.pathExists(testWorkspacePath)) {
      await fs.remove(testWorkspacePath);
    }
  }
}

runWorkspaceTests().catch((err) => {
  console.error('❌ Workspace Test Failed:', err);
  process.exit(1);
});
