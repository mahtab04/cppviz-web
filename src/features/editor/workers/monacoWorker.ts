/* Setup Monaco Editor workers for local bundling with Vite */
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

// Monaco needs a global worker factory
self.MonacoEnvironment = {
  getWorker(_: string, _label: string) {
    return new editorWorker();
  },
};
