/**
 * Custom config parser that only supports JSON and YML formats
 */
const Yaml = require('js-yaml')

const Parser = module.exports

Parser.parse = function (filename, content) {
  var parserName = filename.substr(filename.lastIndexOf('.') + 1) // file extension
  if (typeof definitions[parserName] === 'function') {
    return definitions[parserName](filename, content)
  }
}

Parser.yamlParser = function (filename, content) {
  return Yaml.load(content)
}

Parser.jsonParser = function (filename, content) {
  return JSON.parse(content)
}

/**
 * Strip all Javascript type comments from the string.
 *
 * The string is usually a file loaded from the O/S, containing
 * newlines and javascript type comments.
 *
 * Thanks to James Padolsey, and all who contributed to this implementation.
 * http://james.padolsey.com/javascript/javascript-comment-removal-revisted/
 *
 * @protected
 * @method stripComments
 * @param fileStr {string} The string to strip comments from
 * @param stringRegex {RegExp} Optional regular expression to match strings that
 *   make up the config file
 * @return {string} The string with comments stripped.
 */
Parser.stripComments = function (fileStr, stringRegex) {
  stringRegex = stringRegex || /(['"])(\\\1|.)+?\1/g

  var uid = '_' + +new Date(),
    primitives = [],
    primIndex = 0

  return (
    fileStr

      /* Remove strings */
      .replace(stringRegex, function (match) {
        primitives[primIndex] = match
        return uid + '' + primIndex++
      })

      /* Remove Regexes */
      .replace(
        /([^\/])(\/(?!\*|\/)(\\\/|.)+?\/[gim]{0,3})/g,
        function (match, $1, $2) {
          primitives[primIndex] = $2
          return $1 + (uid + '') + primIndex++
        },
      )

      /*
      - Remove single-line comments that contain would-be multi-line delimiters
          E.g. // Comment /* <--
      - Remove multi-line comments that contain would be single-line delimiters
          E.g. /* // <--
     */
      .replace(/\/\/.*?\/?\*.+?(?=\n|\r|$)|\/\*[\s\S]*?\/\/[\s\S]*?\*\//g, '')

      /*
      Remove single and multi-line comments,
      no consideration of inner-contents
     */
      .replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '')

      /*
      Remove multi-line comments that have a replaced ending (string/regex)
      Greedy, so no inner strings/regexes will stop it.
     */
      .replace(RegExp('\\/\\*[\\s\\S]+' + uid + '\\d+', 'g'), '')

      /* Bring back strings & regexes */
      .replace(RegExp(uid + '(\\d+)', 'g'), function (match, n) {
        return primitives[n]
      })
  )
}

/**
 * Strip YAML comments from the string
 *
 * The 2.0 yaml parser doesn't allow comment-only or blank lines.  Strip them.
 *
 * @protected
 * @method stripYamlComments
 * @param fileStr {string} The string to strip comments from
 * @return {string} The string with comments stripped.
 */
Parser.stripYamlComments = function (fileStr) {
  // First replace removes comment-only lines
  // Second replace removes blank lines
  return fileStr.replace(/^\s*#.*/gm, '').replace(/^\s*[\n|\r]+/gm, '')
}

/**
 * Parses the environment variable to the boolean equivalent.
 * Defaults to false
 *
 * @param {String} content - Environment variable value
 * @return {boolean} - Boolean value fo the passed variable value
 */
Parser.booleanParser = function (filename, content) {
  return content === 'true'
}

/**
 * Parses the environment variable to the number equivalent.
 * Defaults to undefined
 *
 * @param {String} content - Environment variable value
 * @return {Number} - Number value fo the passed variable value
 */
Parser.numberParser = function (filename, content) {
  const numberValue = Number(content)
  return Number.isNaN(numberValue) ? undefined : numberValue
}

var order = ['json', 'yaml', 'yml', 'boolean', 'number']
var definitions = {
  json: Parser.jsonParser,
  yaml: Parser.yamlParser,
  yml: Parser.yamlParser,
  boolean: Parser.booleanParser,
  number: Parser.numberParser,
}

Parser.getParser = function (name) {
  return definitions[name]
}

Parser.setParser = function (name, parser) {
  definitions[name] = parser
  if (order.indexOf(name) === -1) {
    order.push(name)
  }
}

Parser.getFilesOrder = function (name) {
  if (name) {
    return order.indexOf(name)
  }
  return order
}

Parser.setFilesOrder = function (name, newIndex) {
  if (Array.isArray(name)) {
    return (order = name)
  }
  if (typeof newIndex === 'number') {
    var index = order.indexOf(name)
    order.splice(newIndex, 0, name)
    if (index > -1) {
      order.splice(index >= newIndex ? index + 1 : index, 1)
    }
  }
  return order
}
