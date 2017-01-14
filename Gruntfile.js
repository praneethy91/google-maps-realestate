module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        uglify: {
            dependency: {
              files: {
                'dist/js/dep.min.js': ['bower_components/jquery/dist/jquery.min.js', 'bower_components/knockout/dist/knockout.js']
              }
            },
            sourcejs: {
              files: {
                'dist/js/my.min.js': ['src/js/maps.js']
              }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            combine: {
                files: {
                    'dist/css/all.css': ['src/css/style.css']
                }
            },
            target: {
                files: [{
                  expand: true,
                  cwd: 'dist/css',
                  src: ['all.css', '!**/*.min.css'],
                  dest: 'dist/css',
                  ext: '.min.css'
                }]
            }
        },
        watch: {
            css: {
                files: 'src/css/**/*.css',
                tasks: [
                    "cssmin"
                ]
            },
            js: {
                files: 'src/js/**/*.js',
                tasks: [
                    "uglify"
                ]
            }
        }
    });

    grunt.registerTask('default', [
        'cssmin',
        'uglify',
        'watch'
    ]);
};