"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var yaml = require("js-yaml");
var plist = require('plist');

var text = fs.readFileSync("../touist.YAML-tmLanguage", "utf8");
var grammar = yaml.safeLoad(text);

// Json version
fs.writeFileSync("../touist.JSON-tmLanguage", JSON.stringify(grammar, null, '\t'));
// Plist version (tmLanguage uses the plist format)
fs.writeFileSync("../touist.tmLanguage", plist.build(grammar));
