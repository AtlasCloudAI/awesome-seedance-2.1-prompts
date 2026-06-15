# Local Development

This repository mirrors Seedance 2.0 prompt data from `../homepage-v2/src/data`.

## Commands

```bash
npm install
npm run build-all
```

## What Happens

- `npm run sync` reads localized Seedance 2.0 prompt data, twitter/community prompt data, and video maps from `homepage-v2`.
- `npm run generate` turns the generated JSON files into multilingual README files.

## Source Of Truth

- Official prompts: `../homepage-v2/src/data/seedance20-prompts-*.json`
- Community prompts: `../homepage-v2/src/data/seedance20-twitter-prompts*.json`
- Video maps: `../homepage-v2/src/data/seedance20-video-map.json` and `seedance20-twitter-video-map.json`
