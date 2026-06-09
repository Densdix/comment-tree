import { defineConfig } from '@vscode/test-cli';
import { fileURLToPath } from 'url';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	workspaceFolder: fileURLToPath(new URL('.', import.meta.url)),
});
