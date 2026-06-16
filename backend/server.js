const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");

const {
  extractResumeText
} = require("./resume-analyzer/parser");

const {
  calculateATS
} = require("./resume-analyzer/atsScore");

const {
  findMissingSkills
} = require("./resume-analyzer/skills");

const {
  getSuggestions
} = require("./resume-analyzer/suggestions");


const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Resume upload configuration
const upload = multer({
  storage: multer.memoryStorage()
});



// ===============================
// Existing Perl Code Runner API
// ===============================

app.post("/run", (req, res) => {

  const code = req.body.code;


  if (!code) {
    return res.json({
      output: "No code provided"
    });
  }


  fs.writeFileSync(
    "script.pl",
    code
  );


  exec(
    "perl script.pl",
    (err, stdout, stderr) => {

      if (err) {
        return res.json({
          output: stderr || err.message
        });
      }


      res.json({
        output: stdout || "No output"
      });

    }
  );

});




// ===============================
// AI Resume Analyzer API
// ===============================

app.post(
  "/analyze-resume",
  upload.single("resume"),

  async (req, res) => {

    try {


      if (!req.file) {

        return res.status(400).json({
          error: "No resume uploaded"
        });

      }


      const text =
        await extractResumeText(req.file);



      const score =
        calculateATS(text);



      const missing =
        findMissingSkills(text);



      const tips =
        getSuggestions(score);



      res.json({

        atsScore: score,

        missingSkills: missing,

        suggestions: tips

      });


    }

    catch(error) {

      console.error(error);


      res.status(500).json({

        error: error.message

      });

    }

  }

);




// ===============================
// Session API
// ===============================

app.get("/api/session", (req, res) => {

  res.json({

    user: {
      name: "Guest"
    }

  });

});




// Start Server

app.listen(5000, () => {

  console.log(
    "Backend server running on port 5000"
  );

});