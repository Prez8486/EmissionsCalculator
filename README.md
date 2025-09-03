# emissionscalculator

This guide should help you run this app in VS Code.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup, ensure dependencies are up to date

```sh
npm install
```

### Compile and Hot-Reload for Development, runs in development mode

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## For Testing in Mobile App Environment
### Update Android project with the latest web build

```sh
npx cap sync android 
```

### Sync with android build 

```sh
npx cap copy android 
```

### Open in android studio 

```sh
npx cap open android 
```
