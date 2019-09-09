# DeepSec UI

User interface for [DeepSec](https://github.com/DeepSec-prover/deepsec). **Work in progress**.

Powered by [Electron](https://electronjs.org) ([doc](https://electronjs.org/docs)).

## Installation

Download the binary file for your OS.

TODO : Add links

## Dev Setup

Requirements : [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com))

```bash
# Clone this repository
git clone https://github.com/DeepSec-prover/deepsec_ui

# Go into the repository
cd electron-quick-start

# Install dependencies
npm install

# Run the app
npm start
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.

### Environment variables

- `NODE_ENV` can be :
  - `prod` (default) : For final user
  - `dev` : Enable development tools and mock data

### Commands

- `npm start` : Run the application (and set `NODE_ENV` as `dev`)
- `npm check` : Check the code syntax
- `package-mac` : Build and package the application for MacOS (all architectures)
- `package-win` : Build and package the application for Windows  (all architectures)
- `package-linux` : Build and package the application for Linux  (all architectures)

## File structure

- `package.json` - Points to the app's main file and lists its details and dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This is the app's **main process**.
- `views/` - Contains all HTML web pages to render.

The log file `app.log` is stored : 
- Packaged : In the OS default user's data directory
- Development : In the app root directory
