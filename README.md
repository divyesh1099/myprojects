# 🚁 My Projects 🌌

An interactive 3D project showcasing web application inspired by Bruno Simon’s legendary site. Drive a drone through space, discover planets, and explore project showcases in a playful, immersive world.

> 🔥 Live Demo: _(You’ll link this after deployment)_  
> 🛠️ Built using: `Three.js`, `OrbitControls`, `GLTFLoader`, `CanvasTexture`, `WebGL`, `Vite`

---

## ✨ Features

- 🎮 Drive a Quadcopter Drone using `WASD` / `QE`
- 🌍 Explore a 3D Solar System
- 💡 Glow effects + Project Info Screens when near planets
- 💬 Special Dedication: `"❤️ Moti"` appears above the Sun
- 🧠 Intelligent Camera: Follows drone by default, lets you orbit freely
- 🖥️ Optimized for WebGL-powered browsers

---

## 🧱 Project Structure

```
drone-portfolio-3d/
├── assets/
│   ├── drone/                # 3D Drone model (.glb)
│   ├── planets/              # Solar system model (.glb)
│   └── skybox/               # Skybox textures (right.png, left.png, etc.)
├── public/                   # For favicon or custom fonts (if needed)
├── index.html                # Main HTML entry
├── app.js                    # Three.js scene setup and logic
├── styles.css                # (Optional) Styles if needed
├── README.md                 # This file
└── vite.config.js            # Vite config for fast dev server
```

---

## 🎮 Controls

| Key        | Action             |
|------------|--------------------|
| `W` / `S`  | Move Forward / Backward |
| `A` / `D`  | Move Left / Right  |
| `Q` / `E`  | Rotate Left / Right |
| Mouse      | Rotate Camera      |
| Scroll     | Zoom In / Out      |

---

## 🚀 Getting Started

### 1. 📦 Clone the Repository

```bash
git clone https://github.com/divyesh1099/myprojects.git
cd myprojects
```

### 2. 📁 Place Your Assets

Put the following files in `./assets/`:

- 🛸 **Drone GLB** in `assets/drone/`
- 🌍 **Planets GLB** in `assets/planets/`
- 🌌 **Skybox Textures** in `assets/skybox/`  
  _(Include: right.png, left.png, top.png, bottom.png, front.png, back.png)_

### 3. 🧱 Install Dependencies

```bash
npm install
```

If using [Vite](https://vitejs.dev/), you can add it with:

```bash
npm install vite
```

### 4. 🧪 Run the Dev Server

```bash
npx vite
```

Now open: [http://localhost:5173](http://localhost:5173)

---

## 🌍 Deployment Guide

### Option 1: **Vercel (Recommended)**

1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repo
3. Set **Framework = Vanilla**
4. Set **Output Directory = dist**
5. Click **Deploy**

---

### Option 2: **GitHub Pages**

1. Build the project:

```bash
npm run build
```

2. Install `gh-pages` if not already:

```bash
npm install gh-pages --save-dev
```

3. Update `package.json`:

```json
"homepage": "https://your-username.github.io/drone-portfolio-3d",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

4. Deploy:

```bash
npm run deploy
```

---

## 🎨 Credits

- Models from [Sketchfab](https://sketchfab.com/)
- Inspired by [Bruno Simon’s portfolio](https://bruno-simon.com/)
- Fonts: [Three.js Font Loader](https://threejs.org/docs/#examples/en/loaders/FontLoader)
- Space Skybox: [Poly Haven](https://polyhaven.com/)

---

## ❤️ Special Thanks

> Dedicated to **Moti** – for being the light of this universe 🌞

---

## 📬 Contact

**Divyesh Vishwakarma**  
🌐 [divyeshvishwakarma.com](https://divyeshvishwakarma.com)  
🐙 [github.com/divyesh1099](https://github.com/divyesh1099)