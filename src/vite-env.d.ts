/// <reference types="vite/client" />

declare module '*.css' {
  const content: string
  export default content
}

declare const __BUILD_ID__: string
