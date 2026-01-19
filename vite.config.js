import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({
      // editorWorkerService is required
      languageWorkers: ["editorWorkerService", "json", "css", "html", "typescript"],
      customWorkers: [{ label: "graphql", entry: "monaco-graphql/esm/graphql.worker" }],
    }),
  ],
  server: { port: 3000 },
});
