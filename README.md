<div align="center">
  <h1>Farm Clicker</h1>

  <p>
    A cozy browser clicker game where you harvest crops, unlock upgrades,
    and collect helpful auto clickers for your tiny farm.
  </p>

  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-8.0-646cff?style=for-the-badge&logo=vite&logoColor=white" />
    <img alt="Phaser" src="https://img.shields.io/badge/Phaser-3.90-8bd9ff?style=for-the-badge" />
    <img alt="License" src="https://img.shields.io/badge/License-GPL--3.0-2ea44f?style=for-the-badge" />
  </p>
</div>

---

## Table of Contents

- [About](#about)
- [Play Online](#play-online)
- [Features](#features)
- [Gameplay](#gameplay)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Game Systems](#game-systems)
- [Assets](#assets)
- [Development Notes](#development-notes)
- [Roadmap Ideas](#roadmap-ideas)
- [License](#license)

## About

**Farm Clicker** is a lightweight incremental farming game built with
**Phaser**, **TypeScript**, and **Vite**. The player starts by cutting grass,
uses resources to unlock new crops, improves growth speed with fertilizers,
and buys auto clickers that generate resources automatically.

The game is designed as a responsive full-screen browser experience and keeps
progress saved locally through the browser's `localStorage`.

## Play Online

Farm Clicker is available on both desktop and mobile browsers:

**[https://farm-clicker-mu.vercel.app/](https://farm-clicker-mu.vercel.app/)**

## Features

- **Clicker farming loop** with immediate visual feedback.
- **Multiple crop types**: grass, wheat, and carrots.
- **Unlockable crop progression** through the in-game shop.
- **Fertilizer upgrades** that reduce crop growth time.
- **Auto clicker helpers**:
  - Bunny runs across the farm and produces carrots.
  - Cows wander, eat, and produce grass.
  - Farmer waits for wheat to grow, cuts it, and produces wheat.
- **Responsive Phaser canvas** that adapts to desktop and smaller screens.
- **Animated sprites** for crops and auto clickers.
- **Persistent save system** using `localStorage`.
- **Modal upgrade shop** with crop, fertilizer, and auto clicker sections.

## Gameplay

The main loop is simple:

1. Harvest grass to earn your first resource.
2. Open the shop and unlock wheat.
3. Use wheat to unlock carrots.
4. Buy fertilizers to speed up crop growth.
5. Purchase auto clickers to automate parts of the farm.
6. Keep expanding your production flow.

### Crops

| Crop | Role | Behavior |
| --- | --- | --- |
| Grass | Starting crop | Can be cut immediately and may spawn rare reward frames. |
| Wheat | Unlockable crop | Grows over time before it can be harvested for a bonus. |
| Carrot | Unlockable crop | Slower crop with stronger late-game use and auto clicker synergy. |

### Upgrades

| Category | Examples | Purpose |
| --- | --- | --- |
| Crops | Buy wheat, buy carrot | Unlock new crop types. |
| Fertilizers | Wheat fertilizer, carrot deluxe fertilizer | Reduce crop growth duration. |
| Auto Clickers | Bunny, cow, farmer | Add automatic resource generation. |

## Tech Stack

| Tool | Purpose |
| --- | --- |
| [Phaser 3](https://phaser.io/) | Game engine, scenes, sprites, animations, tweens, input, and scaling. |
| [TypeScript](https://www.typescriptlang.org/) | Typed game logic and safer refactoring. |
| [Vite](https://vite.dev/) | Fast local development server and production bundling. |
| [ESLint](https://eslint.org/) | Code linting and automatic fixes. |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed.
- npm, which is bundled with Node.js.

### Installation

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Vite will start a local development server and print the URL in the terminal.
Open that URL in your browser to play.

### Build for Production

```bash
npm run build
```

The production output is generated in the `dist/` directory.

### Preview the Production Build

```bash
npm run preview
```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Type-checks the project and builds it for production. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint on `src/` and applies automatic fixes. |

## Project Structure

```text
farm-clicker/
├── public/
│   ├── bunny.png
│   ├── carrot.png
│   ├── cow.png
│   ├── dirt-bg.png
│   ├── farmer.png
│   ├── grass-bg.png
│   ├── grass.png
│   └── wheat.png
├── src/
│   ├── assets/
│   │   └── hero.png
│   ├── game/
│   │   ├── scenes/
│   │   │   ├── ClickerScene.ts
│   │   │   └── UI.ts
│   │   ├── systems/
│   │   │   ├── AutoClickerDefs.ts
│   │   │   ├── Bunny.ts
│   │   │   ├── Cow.ts
│   │   │   ├── CropDefs.ts
│   │   │   ├── Farmer.ts
│   │   │   ├── GameState.ts
│   │   │   ├── SaveSystem.ts
│   │   │   └── UpgradeDefs.ts
│   │   └── Game.ts
│   ├── main.ts
│   └── style.css
├── index.html
├── package.json
└── tsconfig.json
```

## Game Systems

### `ClickerScene`

The main Phaser scene. It is responsible for loading assets, building the farm
view, handling crop interaction, running animations, updating the responsive
layout, and opening the shop.

### `GameState`

A singleton event emitter that stores the current game state:

- Crop amounts.
- Purchased upgrades.
- Unlocked crops.
- Total clicks.
- Cow count.
- Bunny count.
- Farmer count.

It also exposes the core actions used by the scene and UI, such as buying
upgrades, unlocking crops, and adding harvested resources.

### `SaveSystem`

Stores and restores progress through `localStorage` under the key
`clicker-save`.

Saved data includes:

- Crop amounts.
- Purchased upgrades.
- Unlocked crops.
- Cow count.
- Bunny count.
- Farmer count.

The loader also contains compatibility handling for older crop amount keys.

### `UpgradeDefs`

Central definition file for shop items. Each upgrade declares its cost,
requirements, type, target crop, icon, and shop section.

### `CropDefs`

Central definition file for crop behavior, spritesheet metadata, growth timing,
reward values, and display labels.

### `Bunny`, `Cow`, and `Farmer`

Auto clicker systems that add autonomous resource generation and animated
activity to the farm scene.

## Assets

Game assets live mostly in `public/` so Phaser can load them by path at runtime.
The project includes sprites and backgrounds for:

- Grass.
- Wheat.
- Carrots.
- Bunny.
- Cow.
- Farmer.
- Dirt patch.
- Grass background.
- Icons and favicon.

The README cover image is stored at `src/assets/hero.png`.

## Development Notes

- The game is mounted into `#game-container` from `index.html`.
- Phaser uses `Phaser.Scale.RESIZE`, so the canvas follows the browser window.
- Shop UI is rendered with DOM elements on top of the Phaser canvas.
- Save data is local to the current browser and origin.
- Clearing browser site data will reset the saved game.

## Roadmap Ideas

- Add sound effects and background music.
- Add more crops and crop-specific animations.
- Add offline progress calculation.
- Add achievements or milestones.
- Add settings for volume, reset save, and accessibility options.
- Add a dedicated credits screen for asset attribution.

## License

This project is licensed under the **GNU General Public License v3.0**.

See [LICENSE](LICENSE) for the full license text.

---

<div align="center">
  <strong>Plant, harvest, upgrade, repeat.</strong>
  <br />
  Built with TypeScript, Vite, and Phaser.
</div>
