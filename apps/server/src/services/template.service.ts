import fs from 'fs-extra';
import path from 'node:path';

function findMonorepoRoot(startDir: string = process.cwd()): string {
  let curr = startDir;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'pnpm-workspace.yaml'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return startDir;
}

export class TemplateService {
  private templatesRoot: string;

  constructor(templatesRoot?: string) {
    if (templatesRoot) {
      this.templatesRoot = templatesRoot;
    } else if (process.env.TEMPLATES_ROOT) {
      this.templatesRoot = path.resolve(process.env.TEMPLATES_ROOT);
    } else {
      const root = findMonorepoRoot();
      this.templatesRoot = path.resolve(root, 'templates');
    }
  }

  getTemplatePath(templateName: string = 'nextjs'): string {
    return path.resolve(this.templatesRoot, templateName);
  }

  async copyTemplateToWorkspace(
    destinationPath: string,
    templateName: string = 'nextjs'
  ): Promise<void> {
    const templatePath = this.getTemplatePath(templateName);

    if (!(await fs.pathExists(templatePath))) {
      throw new Error(`Template '${templateName}' does not exist at ${templatePath}`);
    }

    await fs.ensureDir(destinationPath);
    await fs.copy(templatePath, destinationPath, {
      overwrite: false,
      filter: (src) => {
        const basename = path.basename(src);
        return (
          basename !== 'node_modules' &&
          basename !== '.git' &&
          basename !== 'dist' &&
          basename !== '.next'
        );
      },
    });
  }
}

export const templateService = new TemplateService();
