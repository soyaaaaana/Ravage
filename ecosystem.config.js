module.exports = {
  apps: [{
    name: "Ravage",
    cwd: __dirname,
    script: require("path").join(__dirname, "main.js")
  }]
}