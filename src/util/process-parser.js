import AtomicRenamer from './AtomicRenamer'
import logger from 'electron-log'

/**
 * String for one code indent
 * @type {string}
 */
const INDENT = '   '
const BREAK_POINT = '\u200B' // zero-width space

/**
 * Format an action list as a string of visible attack trace.
 *
 * @param {Array} actions The list of action of this attack
 * @param {Array} atomicData The table of atomic data
 * @returns {string} The string of visible attack trace
 */
export function formatTrace (actions, atomicData) {
  // New rename table
  const atomic = new AtomicRenamer(atomicData)

  let axiomId = 1
  let res = ''

  actions.forEach(action => {
    switch (action.type) {
      case 'input':
        res += 'in(' + formatRecipe(action.channel, atomic) + ',' +
          formatRecipe(action.term, atomic) + ');' + BREAK_POINT
        break
      case 'output':
        res += 'out(' + formatRecipe(action.channel, atomic) + ',ax_' + axiomId++ + ');' +
          BREAK_POINT
        break
      case 'eavesdrop':
        res += 'eavesdrop(' + formatRecipe(action.channel, atomic) + ',ax_' + axiomId++ +
          ');' + BREAK_POINT
        break
      // Skip others cases because not visible
    }
  })

  return res
}

/**
 * Format a process from a Json format to a readable string.
 *
 * @param {Object} process - The structured process
 * @param {Array|AtomicRenamer} atomicData - The table of atomic data. If it's an array then wrap
 * it with a new Renamer. If it's already a Renamer keep the reference. So this way the Renamer
 * reference can be shared.
 * @returns {string} A readable string which describe the process
 * @see doc/process_structure.md for process structure
 */
export function formatProcess (process, atomicData) {
  logger.debug(`[Start] Parsing a process (atomic data size: ${atomicData.length})`)

  // If the atomic parameter is already a renamer keep it, if not create one
  const atomic = atomicData instanceof AtomicRenamer ? atomicData : new AtomicRenamer(atomicData)

  // Start recursive formatting
  const res = format(process, atomic, 0)
  logger.debug('[Done] Parsing a process')
  return res
}

/**
 * Select the correct formatting function and indent lines
 *
 * @param {Object|undefined} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function format (subProcess, atomic, indent) {
  const linePrefix = strIndent(indent)

  if (!subProcess) {
    return linePrefix + '0\n'
  }

  switch (subProcess.type) {
    case 'Atomic':
      return formatAtomic(subProcess, atomic, indent)
    case 'Function':
      return formatFunction(subProcess, atomic, indent)
    case 'Equality':
      return formatEquality(subProcess, atomic, indent)
    case 'Axiom':
      return formatAxiom(subProcess)
    case 'Attacker':
      return formatAttacker(subProcess)
    case 'New':
      return linePrefix + formatNew(subProcess, atomic, indent)
    case 'LetInElse':
      return linePrefix + formatLetInElse(subProcess, atomic, indent)
    case 'Output':
      return linePrefix + formatOutput(subProcess, atomic, indent)
    case 'Par':
      return linePrefix + formatPar(subProcess, atomic, indent)
    case 'Input':
      return linePrefix + formatInput(subProcess, atomic, indent)
    case 'IfThenElse':
      return linePrefix + formatIfThenElse(subProcess, atomic, indent)
    case 'Bang':
      return linePrefix + formatBang(subProcess, atomic, indent)
    case null:
      return linePrefix + '0\n'
    default:
      // Do not stop the app but log an error
      logger.error(`Try to parse an unknown sub-process type ${subProcess.type}`)
      return `------------ not implemented : ${subProcess.type} ------------`
  }
}

/**
 * Shortcut to create the indentation string
 *
 * @param {number} count - The number of indent
 * @returns {string} The full indentation string
 */
function strIndent (count) {
  return INDENT.repeat((count))
}

/* ============================================================================
   ============================== Format By Type ==============================
   ============================================================================ */

/**
 *  Format "New" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatNew (subProcess, atomic, indent) {
  return `new ${atomic.getAndRename(subProcess.name)};\n` +
    format(subProcess.process, atomic, indent)
}

/**
 *  Format "LetInElse" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatLetInElse (subProcess, atomic, indent) {
  let res = 'let ' + format(subProcess.pattern, atomic, indent) + ' = ' +
    format(subProcess.term, atomic, indent) + ' in \n'

  // No "else" so no indent "in"
  if (subProcess.process_else === undefined) {
    res += format(subProcess.process_then, atomic, indent)
  }
  // With "else" so no indent all
  else {
    res += format(subProcess.process_then, atomic, indent + 1)
    res += strIndent(indent) + 'else\n' +
      format(subProcess.process_else, atomic, indent + 1)
  }

  return res
}

/**
 *  Format "Atomic" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatAtomic (subProcess, atomic, indent) {
  // Fetch subProcess in the atomic table
  return atomic.getAndRename(subProcess.id)
}

/**
 *  Format "Function" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatFunction (subProcess, atomic, indent) {
  const symbol = atomic.get(subProcess.symbol)

  if (symbol.category.type === 'Tuple') {
    return '(' + subProcess.args.map(value => format(value, atomic, indent)).join(',') + ')'
  } else {
    let res = symbol.label

    res += '(' + subProcess.args.map(value => format(value, atomic, indent)).join(',') + ')'

    return res
  }
}

/**
 *  Format "Output" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatOutput (subProcess, atomic, indent) {
  let res = 'out(' + format(subProcess.channel, atomic, indent) + ',' +
    format(subProcess.term, atomic, indent) + ')'

  if (subProcess.process === undefined) {
    res += '\n'
  } else {
    res += ';\n' + format(subProcess.process, atomic, indent)
  }

  return res
}

/**
 *  Format "Par" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatPar (subProcess, atomic, indent) {
  return '(\n' + subProcess.process_list.map(process => {
    return format(process, atomic, indent + 1)
  }).join(strIndent(indent) + ')|(\n') + strIndent(indent) + ')\n'
}

/**
 *  Format "Input" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatInput (subProcess, atomic, indent) {
  let res = 'in(' + format(subProcess.channel, atomic, indent) + ',' +
    format(subProcess.pattern, atomic, indent) + ')'

  if (subProcess.process === undefined) {
    res += '\n'
  } else {
    res += ';\n' + format(subProcess.process, atomic, indent)
  }

  return res
}

/**
 *  Format "IfThenElse" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatIfThenElse (subProcess, atomic, indent) {
  let res = 'if ' + format(subProcess.term1, atomic, indent) + ' = ' +
    format(subProcess.term2, atomic, indent) + ' then\n'

  // No "else" so no indent "then"
  if (subProcess.process_else === undefined) {
    res += format(subProcess.process_then, atomic, indent)
  }
  // With "else" so indent all
  else {
    res += format(subProcess.process_then, atomic, indent + 1) +
      strIndent(indent) + 'else\n' +
      format(subProcess.process_else, atomic, indent + 1)
  }

  return res
}

/**
 *  Format "Bang" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatBang (subProcess, atomic, indent) {
  return `!~${subProcess.multiplicity}\n` + format(subProcess.process, atomic, indent)
}

/**
 *  Format "Equality" type to readable string
 *
 * @param {Object} subProcess - A structured sub-process
 * @param {Object} atomic - The table of atomic data
 * @param {number} indent - The number of indentation character for the current sub-process (>1)
 * @returns {string} A readable string which describe the sub-process and its children
 */
function formatEquality (subProcess, atomic, indent) {
  return '=' + format(subProcess.term, atomic, indent)
}

/**
 * Format "Axiom" type to readable string
 *
 * @param subProcess A structured sub-process
 * @returns {string}
 */
function formatAxiom (subProcess) {
  return 'ax_' + subProcess.id
}

/**
 * Format "Attacker" type to a readable string
 *
 * @param subProcess A structured sub-process
 * @returns {string}
 */
function formatAttacker (subProcess) {
  return subProcess.label
}

/**
 * Format "Recipe" type to readable string
 * Only use for attack trace
 *
 * @param {Object} recipe The recipe to parse
 * @param {Object} atomic The table of atomic data
 * @returns {string} A readable string which describe the recipe
 */
function formatRecipe (recipe, atomic) {
  if (recipe.type === 'Axiom') {
    return 'ax_' + recipe.id
  } else if (recipe.type === 'Function' || recipe.type === 'Attacker') {
    return format(recipe, atomic, 0)
  } else {
    // Do not stop the app but log an error
    logger.error(`Try to parse an unknown recipe type ${recipe.type}`)
    return `------------ not implemented : ${recipe.type} ------------`
  }
}
