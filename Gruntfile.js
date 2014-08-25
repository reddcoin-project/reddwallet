module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('_public/package.json'),
        nodewebkit: {
            options: {
                version: "0.10.0",
                buildDir: './dist',
                platforms: ['linux64', 'linux32'],
                appName: "ReddWallet",
                appVersion: "1.1.0",
                buildType: "versioned",
                winIco: "_public/reddcoin-favi.ico",
                macIcns: "_public/reddcoin_logo.icns"
            },
            src: './_public/**/*'
        }
    });

    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.registerTask('default', ['nodewebkit']);

};
