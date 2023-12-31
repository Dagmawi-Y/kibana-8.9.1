"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = help;
var _lodash = _interopRequireDefault(require("lodash"));
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

function help(command, spaces) {
  if (!_lodash.default.size(command.commands)) {
    return command.outputHelp();
  }
  const defCmd = _lodash.default.find(command.commands, function (cmd) {
    return cmd._name === 'serve';
  });
  const desc = !command.description() ? '' : command.description();
  const cmdDef = !defCmd ? '' : `=${defCmd._name}`;
  return `
Usage: ${command._name} [command${cmdDef}] [options]

${desc}

Commands:
${indent(commandsSummary(command), 2)}

${cmdHelp(defCmd)}
`.trim().replace(/^/gm, spaces || '');
}
function indent(str, n) {
  return String(str || '').trim().replace(/^/gm, _lodash.default.repeat(' ', n));
}
function commandsSummary(program) {
  const cmds = _lodash.default.compact(program.commands.map(function (cmd) {
    const name = cmd._name;
    if (name === '*') return;
    const opts = cmd.options.length ? ' [options]' : '';
    const args = cmd._args.map(function (arg) {
      return humanReadableArgName(arg);
    }).join(' ');
    return [`${name} ${opts} ${args}`, cmd.description()];
  }));
  const cmdLColWidth = cmds.reduce(function (width, cmd) {
    return Math.max(width, cmd[0].length);
  }, 0);
  return cmds.reduce(function (help, cmd) {
    return `${help || ''}${_lodash.default.padEnd(cmd[0], cmdLColWidth)} ${cmd[1] || ''}\n`;
  }, '');
}
function cmdHelp(cmd) {
  if (!cmd) return '';
  return `
"${cmd._name}" Options:

${indent(cmd.optionHelp(), 2)}
`.trim();
}
function humanReadableArgName(arg) {
  const nameOutput = arg.name + (arg.variadic === true ? '...' : '');
  return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
}
module.exports = exports.default;