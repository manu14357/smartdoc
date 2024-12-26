const { exec } = require('child_process');

exec('next build', (err, stdout, stderr) => {
  if (err) {
    console.error(`Error during build: ${stderr}`);
    // Check for specific errors you want to ignore and handle them
    if (stderr.includes('SyntaxError: missing ) after argument list')) {
      console.log('Ignoring specific syntax error and continuing...');
      // You can add more logic here to handle other specific errors
    } else {
      // Exit the process with an error status code for other errors
      process.exit(1);
    }
  } else {
    console.log(stdout);
  }
});