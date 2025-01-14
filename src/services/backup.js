const { exec } = require("child_process")
const path = require("path")
const os = require("os")
const dotenv = require("dotenv")
const cron = require("node-cron")
const { cooldownResetService } = require("../utils/helper")

dotenv.config()

// MongoDB Atlas connection string
const uri = process.env.MONOGO_BACKUP_URI

// Backup folder path
const backupFolderPath = path.join(os.homedir(), "backup")

// Function to execute mongodump command
const performBackup = () => {
  // Create the mongodump command
  const command = `mongodump --uri="${uri}" --out="${backupFolderPath}"`

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing mongodump: ${error.message}`)
      return
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`)
    }

    console.log(`stdout: ${stdout}`)
    console.log("Backup process completed.")
  })
}

const runCron = () => {
  // // Schedule the task to run every 24 hours
  cron.schedule("0 0 * * *", () => {
    console.log("Starting scheduled backup...")
    performBackup()
  })
}

const cooldownResetServiceCron = () => {
  // Schedule the task to run every 5 seconds
  cron.schedule("*/5 * * * * *", () => {
    console.log("Starting cooldown reset service...")
    cooldownResetService()
  })
}

module.exports = { runCron, cooldownResetServiceCron }
