# Cozy Corner

Display an image or GIF in a cozy corner of your Visual Studio Code editor. A minimal and cute companion for your coding sessions.

## Features

- Display images and GIFs directly in the Explorer panel
- Adjustable size, opacity, and brightness
- Optional polaroid-style frame with customizable color, opacity and text
- Adjustable padding and border-radius for the image
- Optional shadow behind the image
- Three scale modes: fit, fill (cropped square), original (natural size)
- Comfortable night mode with brightness and opacity controls
- Lightweight and zero distractions

## Preview

#### Gif preview
<p align="start">
  <img src="assets/preview.gif" alt="Cozy Corner polaroid frame preview" width="600">
</p>

#### Image preview
<p align="start">
  <img src="assets/preview.png" alt="Cozy Corner dimmed image preview" width="600">
</p>

## Installation

### From Marketplace 
1. Open Visual Studio Code.
2. Go to Extensions.
3. Search for `Cozy Corner`.
4. Install and enjoy.

### From VSIX
1. Download the `cozy-corner-0.3.0.vsix` file.
2. Open Visual Studio Code.
3. Go to Extensions (`Ctrl+Shift+X`).
4. Click the `...` menu and select `Install from VSIX...`.
5. Select the `.vsix` file.

## Usage

1. Press `Ctrl+Shift+P` to open the command palette.
2. Run **Cozy Corner: Select image** and choose your image or GIF.
3. The image appears in the Explorer panel under the **Cozy Corner** section.
4. Adjust settings in `settings.json`:

```json
{
  "cozycorner.imagePath": "/path/to/your/image.gif",
  "cozycorner.size": 220,
  "cozycorner.padding": 16,
  "cozycorner.borderRadius": 8,
  "cozycorner.opacity": 1.0,
  "cozycorner.brightness": 100,
  "cozycorner.scale": "fit",
  "cozycorner.shadow": false,
  "cozycorner.framePolaroid": false,
  "cozycorner.frameColor": "#ffffff",
  "cozycorner.frameOpacity": 1.0,
  "cozycorner.frameText": ""
}
```

## Settings reference

| Setting | Default | Description |
|---|---|---|
| `cozycorner.imagePath` | `""` | Absolute path to the image or GIF |
| `cozycorner.size` | `220` | Width of the image in pixels |
| `cozycorner.opacity` | `1.0` | Opacity of the image (0.0–1.0) |
| `cozycorner.brightness` | `100` | Brightness percentage (0–100) |
| `cozycorner.padding` | `16` | Padding around the image (0–16) |
| `cozycorner.borderRadius` | `8` | Border radius of image corners (0–8) |
| `cozycorner.scale` | `"fit"` | Scale mode: fit, fill, original |
| `cozycorner.shadow` | `false` | Subtle shadow behind the image |
| `cozycorner.framePolaroid` | `false` | Enable polaroid-style frame |
| `cozycorner.frameColor` | `"#ffffff"` | Background color of the frame |
| `cozycorner.frameOpacity` | `1.0` | Opacity of the frame background |
| `cozycorner.frameText` | `""` | Text on the frame (max 40 chars) |

## Privacy & Security

- **No telemetry**: Cozy Corner does not collect any usage data or analytics.
- **No network requests**: All processing is local. No external resources are loaded.
- **Local files only**: The extension only loads image files you explicitly select.
- **Size limit**: Images larger than 10 MB are rejected to prevent excessive memory usage.
- **Permissions**: Cozy Corner only needs permission to read the image file you choose.

## Repository

Source code is available on GitHub:
https://github.com/Sebithaz-dev/Cozy-Corner
