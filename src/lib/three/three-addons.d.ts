/**
 * Type declarations for Three.js addon paths (e.g. GLTFLoader).
 * Main 'three' types come from @types/three.
 */
declare module 'three/addons/loaders/GLTFLoader.js' {
	import type { Group, LoadingManager } from 'three';
	export class GLTFLoader {
		constructor(manager?: LoadingManager);
		load(
			url: string,
			onLoad: (gltf: { scene: Group }) => void,
			onProgress?: (event: ProgressEvent) => void,
			onError?: (error: unknown) => void
		): void;
	}
}
