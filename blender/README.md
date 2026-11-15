# Photoreal scene (Blender bake)

Builds the photoreal version of the Haven care wing, bakes its lighting with Cycles, and writes web-ready files to `safer/public/assets/photo/`.

1. `python blender/fetch_assets.py` downloads CC0 Poly Haven textures, models and the `kloppenheim_06_puresky` sky into `blender/assets/` (git-ignored, ~130 MB).
2. `blender -b -P blender/build_scene.py -- --samples 512` builds the scene, renders `hero_poster.jpg`, bakes lightmaps and exports GLBs. Add `--preview-only` to render just the poster.
   Portable Blender used here: `%LOCALAPPDATA%\Programs\blender-5.3.0-windows-x64\blender.exe`.
3. View it: run the site and open `/?look=photo` (or use the Stylized / Photoreal switch in the hero).

How it works: each group (base, walls, roof, furniture, ground) gets one lightmap of lighting only (no colour). The browser draws the tiled textures with `MeshBasicMaterial` and multiplies them by the lightmap (UV1). Trees and shrubs are loaded once and cloned, lit live by the sky. The layout matches `safer/public/cinematic/scene3d.js` (same coordinates), so the scroll flight, sensors and resident work unchanged.

Credits: textures, models and sky from [Poly Haven](https://polyhaven.com) (CC0).
