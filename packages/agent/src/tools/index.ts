import { AgentContext } from '../types.js';
import { createListFilesTool } from './list-files.js';
import { createReadFileTool } from './read-file.js';
import { createWriteFileTool } from './write-file.js';
import { createEditFileTool } from './edit-file.js';
import { createRunCommandTool } from './run-command.js';

export function createAgentTools(context: AgentContext) {
  return {
    list_files: createListFilesTool(context),
    read_file: createReadFileTool(context),
    write_file: createWriteFileTool(context),
    edit_file: createEditFileTool(context),
    run_command: createRunCommandTool(context),
  };
}

export * from './list-files.js';
export * from './read-file.js';
export * from './write-file.js';
export * from './edit-file.js';
export * from './run-command.js';
