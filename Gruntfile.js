module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('_public/package.json'),
        nodewebkit: {
            options: {
                version: "0.10.0",
                build_dir: './dist',
                mac: true,
                win: false,
                linux32: false,
                linux64: false
            },
            src: './_public/**/*'
        }
    });

    grunt.loadNpmTasks('grunt-node-webkit-builder');

    grunt.registerTask('default', ['nodewebkit']);
};
