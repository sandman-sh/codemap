import { RepoStructure, CodeNode } from "@codemapai/api-client";

export const MOCK_REPO: RepoStructure = {
  repoName: "premium-todo-app",
  fileCount: 15,
  languages: ["TypeScript", "TSX", "CSS"],
  entryPoints: ["/src/main.tsx"],
  totalSize: 45000,
  rootNode: {
    id: "root",
    name: "premium-todo-app",
    type: "root",
    path: "/",
    children: [
      {
        id: "src",
        name: "src",
        type: "folder",
        path: "/src",
        children: [
          {
            id: "main.tsx",
            name: "main.tsx",
            type: "file",
            path: "/src/main.tsx",
            language: "TypeScript",
            complexity: "low",
            isEntryPoint: true,
            children: [
              { id: "main-render", name: "render()", type: "function", path: "/src/main.tsx:render" }
            ]
          },
          {
            id: "App.tsx",
            name: "App.tsx",
            type: "file",
            path: "/src/App.tsx",
            language: "TSX",
            complexity: "medium",
            children: [
              { id: "App-comp", name: "App Component", type: "function", path: "/src/App.tsx:App" }
            ]
          },
          {
            id: "components",
            name: "components",
            type: "folder",
            path: "/src/components",
            children: [
              {
                id: "TodoList.tsx",
                name: "TodoList.tsx",
                type: "file",
                path: "/src/components/TodoList.tsx",
                complexity: "high",
                children: [
                  { id: "TodoList-comp", name: "TodoList", type: "function", path: "/src/components/TodoList.tsx:TodoList" },
                  { id: "TodoList-effect", name: "useEffect(fetch)", type: "function", path: "/src/components/TodoList.tsx:useEffect" }
                ]
              },
              {
                id: "TodoItem.tsx",
                name: "TodoItem.tsx",
                type: "file",
                path: "/src/components/TodoItem.tsx",
                complexity: "low"
              }
            ]
          },
          {
            id: "store",
            name: "store",
            type: "folder",
            path: "/src/store",
            children: [
              {
                id: "useStore.ts",
                name: "useStore.ts",
                type: "file",
                path: "/src/store/useStore.ts",
                complexity: "high",
                children: [
                  { id: "store-create", name: "createStore", type: "function", path: "/src/store/useStore.ts:createStore" },
                  { id: "store-persist", name: "persistMiddleware", type: "function", path: "/src/store/useStore.ts:persistMiddleware" }
                ]
              }
            ]
          },
          {
            id: "utils",
            name: "utils",
            type: "folder",
            path: "/src/utils",
            children: [
              {
                id: "api.ts",
                name: "api.ts",
                type: "file",
                path: "/src/utils/api.ts",
                complexity: "medium",
                children: [
                  { id: "api-fetch", name: "fetchData()", type: "function", path: "/src/utils/api.ts:fetchData" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "package.json",
        name: "package.json",
        type: "file",
        path: "/package.json",
        complexity: "low"
      },
      {
        id: "README.md",
        name: "README.md",
        type: "file",
        path: "/README.md",
        complexity: "low"
      }
    ]
  }
};
