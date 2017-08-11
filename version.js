const { execFile } = require("child_process");

const git = (...args) =>
  new Promise((resolve, reject) => {
    execFile("git", args, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });

module.exports.version = () => git("rev-parse",  "@");
