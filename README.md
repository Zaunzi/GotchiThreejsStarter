# Gotchi Three.js Starter

A template for building **Aavegotchi games** with **Three.js** and the **Aavegotchi 3D render pipeline**. Uses SvelteKit for the app shell, Reown AppKit for wallet connection, and Three.js for 3D rendering—with Aavegotchi PNG previews and GLB models from the official renderer batch API.

## What’s in the template

- 🎮 **Three.js** – 3D game engine for Aavegotchi game logic and rendering
- 👻 **Aavegotchi 3D render** – Server-side integration with the renderer batch API: PNG headshot/full for selection, GLB for in-game character
- 🔗 **Wallet integration** – Reown AppKit for connecting wallets and loading Aavegotchis from the user’s wallet
- 🌐 **Base** – Configured for Base Sepolia (testnet) and Base mainnet
- 🎨 **Skeleton UI** – UI and theme (dark/light) for menus and selection screen
- 📱 **Responsive** – SvelteKit + Tailwind for layout; Three.js canvas fills the play viewport
- 🔧 **TypeScript** – Full TypeScript across Svelte and game code
- 🎯 **Third-person controller** – WASD movement, mouse look, optional right-click freelook; camera snaps back behind the model when freelook is released

## Getting started

### Prerequisites

- **Node.js** 20.19.0+ or 22.12.0+ (see `.nvmrc`; [nvm](https://github.com/nvm-sh/nvm) recommended)
- **pnpm** (recommended)

```bash
# Install pnpm
npm install -g pnpm
```

### Setup

1. **Clone and enter the repo**
   ```bash
   git clone <your-repo-url>
   cd GotchiThreejsStarter
   ```

2. **Use the correct Node version**
   ```bash
   nvm use
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Environment**
   ```bash
   cp env.example .env
   ```
   Add your [Reown Cloud](https://cloud.reown.com/) project ID to `.env`:
   ```
   VITE_PROJECT_ID=your_project_id_here
   ```

5. **Run the dev server**
   ```bash
   pnpm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173). Connect your wallet (Base), pick an Aavegotchi, and hit Play to spawn on the purple square with third-person controls.

## Using the Aavegotchi 3D render pipeline

The template uses the **Aavegotchi renderer batch API** (Goldsky + `aavegotchi.com/api/renderer/batch`) to get PNG previews and GLB 3D models for each gotchi.

- **Selection screen** – Each gotchi card calls `GET /api/render/{tokenId}`. The server queries Goldsky for gotchi data, derives the render hash, kicks off the batch, and returns `pngHeadshotUrl`, `pngFullUrl`, and `glbUrl`. Cards show the PNG; the GLB URL is cached for the play scene.
- **Play scene** – The selected gotchi’s GLB is loaded with Three.js `GLTFLoader` and placed in a 3D scene (purple ground, lights). The third-person controller moves the character and camera; the model rotates with the camera look direction.
- **Server module** – Hash derivation and batch logic live in `src/lib/server/renderer.ts`; the API route is `src/routes/api/render/[tokenId]/+server.ts`.

You can extend the play scene (e.g. more environments, gameplay, or UI) while reusing the same selection and render pipeline.

## Project structure (relevant to games)

```
src/
├── lib/
│   ├── components/       # Svelte UI (navbar, wallet, GotchiCard, etc.)
│   ├── config/           # AppKit, contracts (Aavegotchi Diamond)
│   ├── server/           # renderer.ts (Goldsky, hash, batch API)
│   ├── stores/           # walletStore, selectedGotchiStore
│   ├── three/            # ThirdPersonController, playScene (ground, GLB, camera)
│   └── utils/            # contracts, graphql types, web3
├── routes/
│   ├── api/render/       # GET /api/render/[tokenId]
│   ├── +layout.svelte
│   ├── +page.svelte      # Selection screen (gotchi grid, PNG preview, Play)
│   └── play/+page.svelte # Three.js play scene (GLB, WASD, mouse look)
└── ...
```

- **Three.js**: Scene setup, ground, and character loading are in `src/lib/three/playScene.ts`; the third-person camera and input are in `src/lib/three/ThirdPersonController.ts`.
- **Renderer**: Add or tweak render types and polling in `src/lib/server/renderer.ts`; the API route returns URLs for the client.

## Scripts

- `pnpm run dev` – Development server
- `pnpm run build` – Production build
- `pnpm run preview` – Preview production build
- `pnpm run check` – TypeScript/svelte-check

## Networks

- **Base Sepolia** (84532) – Testnet  
- **Base** (8453) – Mainnet  

Wallet and chain config live in `src/lib/config/appkit.ts`; Aavegotchi contract and render pipeline target Base.

## Learn more

- [Aavegotchi](https://aavegotchi.com/) – NFT game and 3D render pipeline
- [Three.js](https://threejs.org/) – 3D library
- [SvelteKit](https://kit.svelte.dev/docs)
- [Reown AppKit](https://docs.reown.com/appkit)
- [Base](https://docs.base.org/)

## License

MIT. Use this template to build your own Aavegotchi games with Three.js and the 3D render pipeline.
