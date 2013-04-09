"use strict";

var exec = require("child_process").exec;
var xslt = require("node_xslt");
var fs = require("fs");

module.exports = function(grunt) {
    var outputPath = "./doc/";
    var privatePath = outputPath + "private/testReport/";

    grunt.registerTask("xunitUnitTests", "Generates XML unit test report", function() {
        var done = grunt.task.current.async();
        exec("grunt mochaTest:unit:xunit:" + privatePath + "/output-unit.xml:silent",
            function(err, stdout, stderr) {
                done(err);
            });
    });

    grunt.registerTask("xunitFunctionalTests", "Generates XML functional test report", function() {
        var done = grunt.task.current.async();
        exec("grunt mochaTest:functional:xunit:" + privatePath + "output-functional.xml:silent",
            function(err, stdout, stderr) {
                done(err);
            });
    });

    grunt.registerTask("xsltUnitTests", "Transforms XML unit test report to HTML", function() {
        saveTransformedDataToFile(privatePath + "template-unit.xsl",
                                  privatePath + "output-unit.xml",
                                  privatePath + "unit.html");
    });

    grunt.registerTask("xsltFunctionalTests", "Transforms XML functional test report to HTML", function() {
        saveTransformedDataToFile(privatePath + "template-functional.xsl",
                                  privatePath + "output-functional.xml",
                                  privatePath + "functional.html");
    });

    grunt.registerTask("concatenateHtml", "Generates final HTML report", function() {
        var header = fs.readFileSync(privatePath + "header.html");
        var functional = fs.readFileSync(privatePath + "functional.html");
        var unit = fs.readFileSync(privatePath + "unit.html");
        var footer = fs.readFileSync(privatePath + "footer.html");

        fs.writeFileSync(outputPath + "testsResults.html", header + functional + unit + footer);
    });

    grunt.registerTask("generateHtmlReport", "Generates HTML test report", ["xunitUnitTests", "xunitFunctionalTests",
        "xsltUnitTests", "xsltFunctionalTests", "concatenateHtml"]);
};

function saveTransformedDataToFile(stylesheetPath, inputPath, outputPath)
{
    var stylesheet = xslt.readXsltFile(stylesheetPath);
    var document = xslt.readXmlFile(inputPath);

    var transformed = xslt.transform(stylesheet, document, []);

    fs.writeFileSync(outputPath, transformed);
}