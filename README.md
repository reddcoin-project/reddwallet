# ReddWallet

The Next Generation Reddcoin Wallet

## Workflow

### 1. Install dependencies

You need the following stuff installed on your machine:
- [Node.js & NPM](http://nodejs.org/) (see the instructions for your operating system. Ensure that globally installed NPM modules are in your PATH!)
- Windows Users: Use a Git Bash or the [PowerShell](http://en.wikipedia.org/wiki/Windows_PowerShell) instead of CMD.exe !
- Linux Users: You may have to do a [symlink](https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0).
- Mac Users: You will need to install node-webkit globally for reasons mentioned below: `npm install -g nodewebkit`
- Git. (Brunch and Bower depend on Git to work.) Windows users: try [this](http://git-scm.com/), there is a good usable CLI included which should work with the workflow out-of-the-box. The primitive CMD.exe is currently NOT supported.
- [Brunch](http://brunch.io/) via a global npm installation: `npm install -g brunch`.
- [Bower](http://bower.io/) via a global npm installation: `npm install -g bower`.

### 2. Clone & Install

- Clone repo
- Run `npm install` in project root
- Run `bower install` in project root
- Run `npm install` within app/assets (this is for npm run app)

### 3. Workflow

The cloned repo should already have the prebuilt assets required to run, but for development you can run from the project root:

- `npm run compiler` This will continually build any assets that change in the `/app` folder. It compiles the assets to the `/_public` folder, which `node-webkit` uses.
- `npm run app` Actually runs the application from the built assets within `/public`.
- `npm run deploy` Will actually build a working version for Windows, Linux & Mac OSX.

- `brunch build` If you need to build the assets manually without wanting to run a continuous builder.

## Caveats

### Linux

As mentioned above, you may need to fix the `libudev.so.0` issue. See [symlink](https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0).

### Mac OSX

When running `npm run app` you may encounter the `Invalid package.json, main is required` error. See this github issue for more details [issue-1503](https://github.com/rogerwang/node-webkit/issues/1503).

The steps for the temporary solution until the issue is fixed:
- Install node-webkit globally `npm -g install nodewebkit` as mentioned above.
- Rename the global `package.json` file to something else (eg `_package.json`). You'll probably need `sudo`.  `cd /usr/local/lib/node_modules/nodewebkit` then `sudo mv package.json _package.json`.
- Run the app directly from inside the `/_public` folder. `cd _public` and then `nodewebkit .`. (Hence the reason for global install).

To create DMG img:

    export VERSION=1.4.0
    sudo hdiutil create -fs HFS+ -volname "ReddWallet" -srcfolder dist/ReddWallet\ -\ v$VERSION/osx/ReddWallet.app/ dist/ReddWallet\ -\ v$VERSION/reddwallet-$VERSION-mac.dmg

### Windows

Not yet tested.

## Extra Info

- `/app/styles` contains all your stylesheets as LESS files. You may look into `/app/styles/app.less` when fine-tuning your included CSS-related components.
- `/app/scripts` is the folder for your coffeescript application logic, especially your AngularJS stuff. The mighty AngularJS main-module is defined in `/app/app.coffee` and includes the angular module loader and the url routing definitions.
- `/app/partials` contains your Jade templates which are compiled and merged into an AngularJS template module. The main index file is located at `/app/index.jade` and will be compiled to an actual `index.html` file.
- `/app/assets` is the catch-all directory for everything else, like images or fonts. The whole directory, including the folder-hierarchy, is copied **as is** into the final application folder. *If you want to use npm modules inside your application, install them here, and NOT in the toplevel folder!* Also, the `/app/assets/package.json` is used to describe and build your application, NOT the toplevel `/package.json`!

For more information see the seed project used for this (node-webkit-hipster-seed)[https://github.com/Anonyfox/node-webkit-hipster-seed]



