#!/usr/bin/env node

const fs = require('fs')
const util = require('util')
const commander = require('commander')
const winattr = require('winattr')
const moment = require('moment')
const notifier = require('node-notifier')

const ARCHIVE_DIR_NAME = process.env.EZA_ARCHIVE_DIR_NAME || 'archive'
const ARCHIVE_DIR_SUFFIX = process.env.EZA_ARCHIVE_DIR_SUFFIX || 'YYYY-MM-DD'
const ARCHIVE_DIR_ICON = process.env.EZA_FOLDER_ICON || ''
const ARCHIVE_DIR_DESKTOPINI = `[.ShellClassInfo]
IconResource=${ARCHIVE_DIR_ICON}
[ViewState]
Mode=
Vid=
FolderType=Generic
`

commander.version('0.3')
    .description(`move files or directories to the archive directory "${ARCHIVE_DIR_NAME}\\${ARCHIVE_DIR_SUFFIX}" at same path.`)
    .usage('FILES...')
    .option('-f, --folder', 'prepare archive folder')
    .parse(process.argv)

const fsp = {
    mkdir: util.promisify(fs.mkdir),
    rename: util.promisify(fs.rename),
    stat: util.promisify(fs.stat),
    writeFile: util.promisify(fs.writeFile)
}

const winattrp = {
    set: util.promisify(winattr.set)
}

function notifyError(message) {
    notifier.notify({
        title: 'eza.js Error',
        message
    })
}

function getArchiveDir(path) {
    const pathElms = path.split(/[/\\]/)
    let filename = pathElms.pop()
    pathElms.push(ARCHIVE_DIR_NAME, moment().format(ARCHIVE_DIR_SUFFIX))
    const ret = pathElms.join('\\')
    return [ret, `${ret}\\${filename}`]
}

async function makeSureArchiveBaseDir(path) {
    try {
        await fsp.mkdir(path)
    } catch (err) {
        if (!commander.folder && err.code !== 'EEXIST') {
            console.log('DEBUG', 'fsp.mkdir failed.', err)
            throw {
                message: 'archive directory preparation failed.'
            }
        }
    }
    await winattrp.set(path, { system: true })
    const desktopIniPath = path + '\\desktop.ini'
    try {
        await fsp.stat(desktopIniPath)
        if (!commander.folder) return true
    } catch (err) {
        if (!commander.folder && err.code !== 'ENOENT') {
            console.log('DEBUG', 'fsp.stat failed.', err)
            return true
        }
    }
    try {
        await fsp.writeFile(desktopIniPath, ARCHIVE_DIR_DESKTOPINI)
    } catch (err) {
        console.log('DEBUG', 'fsp.writeFile failed.', err)
    }
    try {
        await winattrp.set(desktopIniPath, {
            system: true,
            hidden: true
        })
    } catch (err) {
        console.log('DEBUG', 'winattrp.set failed.', err)
    }
    return true
}

async function makeSureArchiveDir(path) {
    const pathElms = path.split(/[/\\]/)
    const base = pathElms.slice(0, -1).join('\\')
    if (!makeSureArchiveBaseDir(base)) return false
    let s
    try {
        s = await fsp.stat(path)
    } catch (err) {
        if (err.code === 'ENOENT') {
            s = null
        } else {
            throw err
        }
    }
    if (!s) {
        try {
            await fsp.mkdir(path)
        } catch (err) {
            return false
        }
    }
    return true
}

async function processOne(target) {
    try {
        try {
            await fsp.stat(target)
        } catch (err) {
            if (err.code === 'ENOENT') {
                notifyError(`Target ${target} does not exists.`)
                return
            }
            throw err
        }
        const [destDir, destPath] = getArchiveDir(target)
        if (!await makeSureArchiveDir(destDir)) {
            notifyError(`Could not create archive folder "${destDir}".`)
        } else {
            fsp.rename(target, destPath)
        }
    } catch (err) {
        console.log('ERROR', JSON.stringify(err))
    }
}

(async () => {
    if (commander.folder) {
        const [destDir,] = getArchiveDir('.')
        const pathElms = destDir.split(/[/\\]/)
        const base = pathElms.slice(0, -1).join('\\')
        await makeSureArchiveBaseDir(base)
    }
    for (let a of commander.args) {
        await processOne(a)
    }
})()
