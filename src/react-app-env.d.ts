/// <reference types="react-scripts" />

// React 17 compatibility fixes
declare module 'react' {
  interface Component {
    refs: any;
  }
}
