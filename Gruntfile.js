module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('_public/package.json'),
        nodewebkit: {
            options: {
                version: "0.10.0",
                buildDir: './dist',
                platforms: ['win', 'osx', 'linux64', 'linux32']
            },
            src: './_public/**/*'
        }
    });

    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.registerTask('default', ['nodewebkit']);

};
