import logger from 'electron-log'
import { dialog, remote } from 'electron'
import fs from 'fs'
import path from 'path'

/**
 * Open the result file selector from the main process.
 * Do not guaranty to return valid file paths.
 *
 * @async
 * @return {Promise<string>} A promise with the file absolute path
 */
export function openResultFileMain () {
  return openResultFile(dialog)
}

/**
 * Open the result file selector from the renderer process.
 * Do not guaranty to return valid file paths.
 *
 * @async
 * @return {Promise<string>} A promise with the file absolute path
 */
export function openResultFileRemote () {
  return openResultFile(remote.dialog)
}

function openResultFile (currentDialog) {
  logger.info('Open result file selection')

  const promise = currentDialog.showOpenDialog(null, {
    properties: ['openFile'],
    message: 'Select one result file', // Message for mac only
    filters: [
      {
        name: 'JSON', extensions: ['json']
      },
      {
        name: 'All', extensions: ['*']
      }]
  })

  // Return the promise
  return promise.then(result => {
    if (!result.canceled) {
      const filePaths = result.filePaths
      if (filePaths !== null && filePaths.length === 1) {
        logger.info(`File selected with success : ${filePaths[0]}`)
        return filePaths[0]
      } else {
        logger.warn('Bad file selection path value', filePaths)
        throw new Error('Bad file selection path value')
      }
    } else {
      logger.info('Open result file canceled')
      throw new Error('Open result file canceled')
    }
  })
}

/**
 * Open the spec files selector from the main process.
 * Do not guaranty to return valid file paths.
 * For linux and window only one from file or directories should be selected.
 *
 * @async
 * @param {boolean} files If true the dialog allow to select file
 * @param {boolean} directories If true the dialog allow to select directories
 * @return {Promise<Array<string>>} A promise with the files absolute path
 */
export function openSpecFilesMain (files, directories) {
  return openSpecFiles(dialog, files, directories)
}

/**
 * Open the spec files selector from the renderer process.
 * Do not guaranty to return valid file paths.
 * For linux and window only one from file or directories should be selected.
 *
 * @async
 * @param {boolean} files If true the dialog allow to select file
 * @param {boolean} directories If true the dialog allow to select directories
 * @return {Promise<Array<string>>} A promise with the files absolute paths
 */
export function openSpecFilesRenderer (files, directories) {
  return openSpecFiles(remote.dialog, files, directories)
}

function openSpecFiles (currentDialog, files, directories) {
  logger.info('Open spec files selection')

  if (!files && !directories) {
    throw new Error('At least one option should be selected (files or directories)')
  }

  const properties = ['multiSelections']
  if (files) properties.push('openFile')
  if (directories) properties.push('openDirectory')

  const filters = [{
    name: 'All', extensions: ['*']
  }]

  // Filter DPS only if file selected
  if (files) {
    filters.unshift({
      name: 'DPS', extensions: ['dps']
    })
  }

  const promise = currentDialog.showOpenDialog(null, {
    properties: properties,
    message: 'Select one or many spec files / directories', // Message for mac only
    filters: filters
  })

  // Return the promise
  return promise.then(result => {
    if (!result.canceled) {
      const paths = result.filePaths
      if (paths !== null && paths.length >= 1) {

        const filePaths = []
        const dirPaths = []
        // Split files and directories
        paths.forEach(path => {
          if (isDir(path)) {
            dirPaths.push(path)
          } else {
            filePaths.push(path)
          }
        })

        logger.info(
          `${filePaths.length} files and ${dirPaths.length} directories selected with success`)

        dirPaths.forEach(dirPath => {
          let files = []
          recursiveFindFiles(dirPath, /.*\.dps$/ui, files)
          logger.debug(`${files.length} files found recursively in the directory "${dirPath}"`)
          filePaths.push.apply(filePaths, files)
        })

        logger.info(`After directories search, ${filePaths.length} files are selected : 
        ${filePaths.join(', ')}`)

        return filePaths
      } else {
        logger.warn('Bad file selection path value', paths)
        throw new Error('Bad file selection path value')
      }
    } else {
      logger.info('Open spec file canceled')
      throw new Error('Open spec file canceled')
    }
  })
}

/**
 * Check if a path is a directory.
 * If the path doesn't exist return false.
 *
 * @param {string} path The path to check
 * @returns {boolean} True if the path is a directory, false if not
 */
function isDir(path) {
  try {
    const stat = fs.lstatSync(path);
    return stat.isDirectory();
  } catch (e) {
    // lstatSync throws an error if path doesn't exist
    return false;
  }
}

/**
 * Look for files recursively in a directory.
 * Select only files matching with the regex.
 *
 * @param {string} dirPath The path to the directory to explore
 * @param {RegExp} regex The regular expression to filter files
 * @param filesResult {Array<string>} The list of matching file paths will be added to this array
 */
function recursiveFindFiles (dirPath, regex, filesResult) {
  const files = fs.readdirSync(dirPath)

  logger.silly(`Explore the directory: ${dirPath}\n${files.join('\n')}`)

  files.forEach(file => {
    file = path.join(dirPath, file)
    if (isDir(file)) {
      recursiveFindFiles(file, regex, filesResult)
    } else if (regex.exec(file) !== null) {
      filesResult.push(file)
    }
  })
}
