# Music Directory

Place your ambient focus music files in this directory.

## Supported Formats
- MP3 (`.mp3`)
- OGG (`.ogg`)

## Default File
The audio player is configured to look for:
- `default.mp3` or `default.ogg`

To use your own music:
1. Add your music file(s) to this directory
2. Rename one of them to `default.mp3` or `default.ogg`
3. Or update the `src` attribute in `app/components/AudioPlayer.tsx` to point to your file

## Example
```
public/music/
  ├── default.mp3
  └── README.md
```

