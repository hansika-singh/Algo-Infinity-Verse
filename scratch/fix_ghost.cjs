const fs = require('fs');
const path = require('path');

const dirs = fs.readdirSync('.');
const ghostDir = dirs.find(d => d.includes('pages') && d !== 'pages');

if (ghostDir) {
  console.log('Ghost dir found:', Buffer.from(ghostDir).toString('hex'));
  const ghostVisPath = path.join(ghostDir, 'visualizers', 'virbt-visualizer');
  const realVisPath = path.join('pages', 'visualizers', 'virbt-visualizer');
  
  if (fs.existsSync(ghostVisPath)) {
    fs.cpSync(ghostVisPath, realVisPath, { recursive: true });
    console.log('Copied virbt-visualizer to real pages/visualizers/');
    fs.rmSync(ghostDir, { recursive: true, force: true });
    console.log('Deleted ghost directory.');
  } else {
    console.log('virbt-visualizer not found inside ghost directory. Contents:');
    console.log(fs.readdirSync(ghostDir));
  }
} else {
  console.log('No ghost dir found.');
}
