module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('_public/package.json'),
        nodewebkit: {
            options: {
                version: "0.10.0",
                buildDir: './dist',
                platforms: ['win', 'osx', 'linux64', 'linux32'],
                appName: "ReddWallet",
                appVersion: "1.0.0",
                buildType: "versioned",
                winIco: "reddcoin-favi.ico",
                macIcns: "reddcoin_logo.icns"
            },
            src: './_public/**/*'
        }
    });

    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.registerTask('default', ['nodewebkit']);

};
