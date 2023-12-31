"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.analyzeArchive = analyzeArchive;
exports.extractArchive = extractArchive;
var _path = _interopRequireDefault(require("path"));
var _fs = require("fs");
var _yauzl = _interopRequireDefault(require("yauzl"));
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

const isDirectoryRegex = /(\/|\\)$/;
function isDirectory(filename) {
  return isDirectoryRegex.test(filename);
}

/**
 * Returns an array of package objects. There will be one for each of
 * package.json files in the archive
 */

function analyzeArchive(archive) {
  const plugins = [];
  const regExp = new RegExp('(kibana[\\\\/][^\\\\/]+)[\\\\/]kibana.json', 'i');
  return new Promise((resolve, reject) => {
    _yauzl.default.open(archive, {
      lazyEntries: true
    }, function (err, zipfile) {
      if (err) {
        return reject(err);
      }
      zipfile.readEntry();
      zipfile.on('entry', function (entry) {
        const match = entry.fileName.match(regExp);
        if (!match) {
          return zipfile.readEntry();
        }
        zipfile.openReadStream(entry, function (error, readable) {
          const chunks = [];
          if (error) {
            return reject(error);
          }
          readable.on('data', chunk => chunks.push(chunk));
          readable.on('end', function () {
            const manifestJson = Buffer.concat(chunks).toString();
            const manifest = JSON.parse(manifestJson);
            plugins.push({
              id: manifest.id,
              stripPrefix: match[1],
              // Plugins must specify their version, and by default that version in the plugin
              // manifest should match the version of kibana down to the patch level. If these
              // two versions need plugins can specify a kibanaVersion to indicate the version
              // of kibana the plugin is intended to work with.
              kibanaVersion: typeof manifest.kibanaVersion === 'string' && manifest.kibanaVersion ? manifest.kibanaVersion : manifest.version
            });
            zipfile.readEntry();
          });
        });
      });
      zipfile.on('close', () => {
        resolve(plugins);
      });
    });
  });
}
function extractArchive(archive, targetDir, stripPrefix) {
  return new Promise((resolve, reject) => {
    _yauzl.default.open(archive, {
      lazyEntries: true
    }, function (err, zipfile) {
      if (err) {
        return reject(err);
      }
      zipfile.readEntry();
      zipfile.on('close', resolve);
      zipfile.on('entry', function (entry) {
        let fileName = entry.fileName;
        if (stripPrefix && fileName.startsWith(stripPrefix)) {
          fileName = fileName.substring(stripPrefix.length);
        } else {
          return zipfile.readEntry();
        }
        if (targetDir) {
          fileName = _path.default.join(targetDir, fileName);
        }
        if (isDirectory(fileName)) {
          (0, _fs.mkdir)(fileName, {
            recursive: true
          }, function (error) {
            if (error) {
              return reject(error);
            }
            zipfile.readEntry();
          });
        } else {
          // file entry
          zipfile.openReadStream(entry, function (error, readStream) {
            if (error) {
              return reject(error);
            }

            // ensure parent directory exists
            (0, _fs.mkdir)(_path.default.dirname(fileName), {
              recursive: true
            }, function (error2) {
              if (error2) {
                return reject(error2);
              }
              readStream.pipe((0, _fs.createWriteStream)(fileName, {
                // eslint-disable-next-line no-bitwise
                mode: entry.externalFileAttributes >>> 16
              }));
              readStream.on('end', function () {
                zipfile.readEntry();
              });
            });
          });
        }
      });
    });
  });
}